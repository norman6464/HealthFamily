package persistence

import (
	"context"
	"os"
	"sync"
	"testing"
	"time"

	"healthfamily/internal/domain/entity"
	"healthfamily/internal/infrastructure/database"
)

// 資格情報の書き込みは、読み出したスナップショットを書き戻す形にしない。
//
// プロフィール更新は password や各コードを読んでから書き戻していた。
// その間にパスワード再設定が走ると、再設定が巻き戻り、消費済みの
// 再設定コードまで復活する。試行回数も同様で、並列に投げられると
// 全員が同じ値を読むため上限が並列数だけ薄くなる。
//
// 実行するには HF_DB_INTEGRATION=1 と DATABASE_URL が要る。

func credTestDB(t *testing.T) *database.DB {
	t.Helper()
	if os.Getenv("HF_DB_INTEGRATION") != "1" {
		t.Skip("HF_DB_INTEGRATION=1 以外はスキップ")
	}
	db, err := database.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

func seedUser(t *testing.T, db *database.DB, id string) *UserRepository {
	t.Helper()
	ctx := context.Background()
	_, _ = db.Pool.Exec(ctx, `DELETE FROM "User" WHERE "id" = $1`, id)
	t.Cleanup(func() { _, _ = db.Pool.Exec(context.Background(), `DELETE FROM "User" WHERE "id" = $1`, id) })
	repo := NewUserRepository(db)
	if err := repo.Create(ctx, &entity.User{
		ID: id, Email: id + "@example.test", Password: "$2a$12$original", CharacterType: "cat",
	}); err != nil {
		t.Fatalf("create: %v", err)
	}
	return repo
}

// プロフィール更新が、その間に起きたパスワード再設定を巻き戻さないこと。
func TestUpdateProfile_資格情報を巻き戻さない(t *testing.T) {
	db := credTestDB(t)
	ctx := context.Background()
	const id = "u-cred-profile"
	repo := seedUser(t, db, id)

	// 別のリクエストが利用者を読み込む（この時点のパスワードは original）
	stale, err := repo.FindByID(ctx, id)
	if err != nil || stale == nil {
		t.Fatalf("find: %v", err)
	}

	// その間にパスワード再設定が完了する
	if err := repo.SaveResetCode(ctx, id, "654321", time.Now().Add(time.Hour)); err != nil {
		t.Fatalf("save reset code: %v", err)
	}
	if err := repo.ApplyPasswordReset(ctx, id, "$2a$12$brandnew"); err != nil {
		t.Fatalf("reset: %v", err)
	}

	// 先に読み込んでいた側がプロフィールだけ変えて保存する
	name := "新しい表示名"
	stale.DisplayName = &name
	if err := repo.UpdateProfile(ctx, stale); err != nil {
		t.Fatalf("update profile: %v", err)
	}

	after, err := repo.FindByID(ctx, id)
	if err != nil || after == nil {
		t.Fatalf("reload: %v", err)
	}
	if after.Password != "$2a$12$brandnew" {
		t.Errorf("パスワードが巻き戻った: %q。再設定したのに古いパスワードで入れる", after.Password)
	}
	if after.DisplayName == nil || *after.DisplayName != name {
		t.Error("巻き戻しを防ぐ代わりに、通常のプロフィール更新が効かなくなっている")
	}
}

// 消費済みの再設定コードが、プロフィール更新で復活しないこと。
func TestUpdateProfile_消費済みコードを復活させない(t *testing.T) {
	db := credTestDB(t)
	ctx := context.Background()
	const id = "u-cred-code"
	repo := seedUser(t, db, id)

	expiry := time.Now().Add(10 * time.Minute)
	if err := repo.SaveResetCode(ctx, id, "654321", expiry); err != nil {
		t.Fatalf("save reset code: %v", err)
	}
	stale, _ := repo.FindByID(ctx, id)

	if err := repo.ApplyPasswordReset(ctx, id, "$2a$12$brandnew"); err != nil {
		t.Fatalf("reset: %v", err)
	}

	name := "名前"
	stale.DisplayName = &name
	if err := repo.UpdateProfile(ctx, stale); err != nil {
		t.Fatalf("update profile: %v", err)
	}

	after, _ := repo.FindByID(ctx, id)
	if after.ResetCode != nil {
		t.Errorf("消費済みの再設定コード %q が復活した。攻撃者が同じコードを再利用できる", *after.ResetCode)
	}
}

// 並列に失敗を投げられても、試行回数を数え落とさないこと。
func TestIncrementAttempts_並列でも数え落とさない(t *testing.T) {
	db := credTestDB(t)
	ctx := context.Background()

	for _, tc := range []struct {
		name   string
		save   func(*UserRepository, string) error
		bump   func(*UserRepository, string) error
		column string
	}{
		{
			name: "メール認証",
			save: func(r *UserRepository, id string) error {
				return r.SaveVerificationCode(ctx, id, "123456", time.Now().Add(time.Hour))
			},
			bump:   func(r *UserRepository, id string) error { return r.IncrementVerificationAttempts(ctx, id, 100) },
			column: "verificationAttempts",
		},
		{
			name: "パスワード再設定",
			save: func(r *UserRepository, id string) error {
				return r.SaveResetCode(ctx, id, "123456", time.Now().Add(time.Hour))
			},
			bump:   func(r *UserRepository, id string) error { return r.IncrementResetAttempts(ctx, id, 100) },
			column: "resetAttempts",
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			id := "u-cred-race-" + tc.column
			repo := seedUser(t, db, id)
			if err := tc.save(repo, id); err != nil {
				t.Fatalf("save: %v", err)
			}

			const parallel = 20
			var wg sync.WaitGroup
			start := make(chan struct{})
			for range parallel {
				wg.Add(1)
				go func() {
					defer wg.Done()
					<-start
					_ = tc.bump(repo, id)
				}()
			}
			close(start)
			wg.Wait()

			var got int
			if err := db.Pool.QueryRow(ctx,
				`SELECT "`+tc.column+`" FROM "User" WHERE "id" = $1`, id).Scan(&got); err != nil {
				t.Fatalf("read: %v", err)
			}
			if got != parallel {
				t.Errorf("並列 %d 回の失敗が %d しか数えられていない。総当たり防御が並列数だけ薄くなる", parallel, got)
			}
		})
	}
}

// 上限に達したらコードを捨てること。捨てないと、保存し忘れた瞬間に上限が無くなる。
func TestIncrementAttempts_上限でコードを捨てる(t *testing.T) {
	db := credTestDB(t)
	ctx := context.Background()
	const id = "u-cred-limit"
	repo := seedUser(t, db, id)

	if err := repo.SaveVerificationCode(ctx, id, "123456", time.Now().Add(time.Hour)); err != nil {
		t.Fatalf("save: %v", err)
	}
	for range 5 {
		if err := repo.IncrementVerificationAttempts(ctx, id, 5); err != nil {
			t.Fatalf("bump: %v", err)
		}
	}

	after, _ := repo.FindByID(ctx, id)
	if after.VerificationCode != nil {
		t.Error("上限に達してもコードが残っている")
	}
	if after.VerificationExpiry != nil {
		t.Error("期限だけ残っている")
	}
}

// 再設定は、コードが一致する行にだけ適用されること。
// 同じコードで二重に走っても、二度目は適用されない。
func TestApplyPasswordReset_コードが消えていれば適用しない(t *testing.T) {
	db := credTestDB(t)
	ctx := context.Background()
	const id = "u-cred-once"
	repo := seedUser(t, db, id)

	if err := repo.SaveResetCode(ctx, id, "654321", time.Now().Add(time.Hour)); err != nil {
		t.Fatalf("save: %v", err)
	}
	if err := repo.ApplyPasswordReset(ctx, id, "$2a$12$first"); err != nil {
		t.Fatalf("first reset: %v", err)
	}

	// 二度目。コードは既に消えている
	if err := repo.ApplyPasswordReset(ctx, id, "$2a$12$second"); err == nil {
		t.Fatal("コードが無いのに再設定が通った")
	}

	after, _ := repo.FindByID(ctx, id)
	if after.Password != "$2a$12$first" {
		t.Errorf("二度目の再設定が適用された: %q", after.Password)
	}
}

// 再設定は発行済みトークンを失効させること。
func TestApplyPasswordReset_世代を繰り上げる(t *testing.T) {
	db := credTestDB(t)
	ctx := context.Background()
	const id = "u-cred-version"
	repo := seedUser(t, db, id)

	before, _, _ := repo.TokenVersion(ctx, id)
	if err := repo.SaveResetCode(ctx, id, "654321", time.Now().Add(time.Hour)); err != nil {
		t.Fatalf("save: %v", err)
	}
	if err := repo.ApplyPasswordReset(ctx, id, "$2a$12$new"); err != nil {
		t.Fatalf("reset: %v", err)
	}

	after, _, _ := repo.TokenVersion(ctx, id)
	if after != before+1 {
		t.Errorf("世代 = %d, want %d。再設定しても攻撃者のトークンが生き残る", after, before+1)
	}
}
