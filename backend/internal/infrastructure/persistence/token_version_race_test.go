package persistence

import (
	"context"
	"os"
	"testing"
	"time"

	"healthfamily/internal/domain/entity"
	"healthfamily/internal/infrastructure/database"
)

// 世代の巻き戻し。
//
// 汎用 Update は読み出し時点の値をそのまま書き戻す。パスワード再設定で
// 世代が 1 に上がった後、まだ 0 を握っている並行リクエストが Update を
// 完了させると 0 に戻り、失効させたはずの JWT が再び通ってしまう。
// プロフィール更新のような何気ない操作が、攻撃者を呼び戻す。
//
// 実行するには HF_DB_INTEGRATION=1 と DATABASE_URL が要る。
func TestTokenVersion_並行更新で巻き戻らない(t *testing.T) {
	if os.Getenv("HF_DB_INTEGRATION") != "1" {
		t.Skip("HF_DB_INTEGRATION=1 以外はスキップ")
	}
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		t.Fatal("DATABASE_URL が必要です")
	}
	ctx := context.Background()
	db, err := database.New(ctx, url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	defer db.Close()

	const id = "u-token-version-race"
	cleanup := func() { _, _ = db.Pool.Exec(ctx, `DELETE FROM "User" WHERE "id" = $1`, id) }
	cleanup()
	defer cleanup()

	repo := NewUserRepository(db)
	if err := repo.Create(ctx, &entity.User{
		ID: id, Email: id + "@example.test", Password: "$2a$12$x", CharacterType: "cat",
	}); err != nil {
		t.Fatalf("create: %v", err)
	}

	// 別のリクエストが利用者を読み込む。この時点の世代は 0
	stale, err := repo.FindByID(ctx, id)
	if err != nil || stale == nil {
		t.Fatalf("find: %v", err)
	}

	// その間にパスワード再設定が走り、世代を繰り上げる
	if err := repo.SaveResetCode(ctx, id, "654321", time.Now().Add(time.Hour)); err != nil {
		t.Fatalf("save reset code: %v", err)
	}
	if err := repo.ApplyPasswordReset(ctx, id, "654321", "$2a$12$new"); err != nil {
		t.Fatalf("reset: %v", err)
	}

	// 先に読み込んでいた側が、無関係な項目を更新して保存する
	name := "更新後の名前"
	stale.DisplayName = &name
	if err := repo.UpdateProfile(ctx, stale); err != nil {
		t.Fatalf("update: %v", err)
	}

	after, _, err := repo.TokenVersion(ctx, id)
	if err != nil {
		t.Fatalf("token version: %v", err)
	}
	if after != 1 {
		t.Fatalf("世代が %d に巻き戻った。失効させた JWT が再び通る", after)
	}

	reloaded, err := repo.FindByID(ctx, id)
	if err != nil || reloaded == nil {
		t.Fatalf("reload: %v", err)
	}
	if reloaded.DisplayName == nil || *reloaded.DisplayName != name {
		t.Error("巻き戻しを防ぐ代わりに、通常の更新まで効かなくなっている")
	}
}
