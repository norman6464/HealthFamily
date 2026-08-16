package usecase

import (
	"context"
	"testing"
	"time"

	"healthfamily/internal/domain/entity"
	"healthfamily/internal/pkg/auth"
)

// パスワード再設定による既存セッションの失効。
//
// 攻撃者にトークンを握られた利用者が、気づいてパスワードを変えたとする。
// それでも攻撃者のトークンが最大7日間そのまま使えるなら、アカウント復旧の
// 導線として機能していない。「パスワードを変えれば追い出せる」は
// 利用者が当然そう思う挙動でもある。
//
// トークンに版番号を載せ、再設定で繰り上げる。鍵の全体ローテーションと違い、
// 当人のセッションだけを狙って切れる。

func revocationTestUsecase(repo *fakeUserRepo, now time.Time) (*AuthUsecase, *auth.TokenManager) {
	tm := auth.NewTokenManager("test-secret-test-secret-test-secret", 7*24*time.Hour)
	uc := NewAuthUsecase(repo, tm, &recordingMailer{}, nil)
	uc.now = func() time.Time { return now }
	return uc, tm
}

func userWithResetCode(now time.Time, code string) *entity.User {
	expiry := now.Add(10 * time.Minute)
	hashed, _ := auth.HashPassword("oldpassword1")
	return &entity.User{
		ID:              "u-1",
		Email:           "victim@example.com",
		Password:        hashed,
		CharacterType:   "cat",
		EmailVerified:   true,
		ResetCode:       &code,
		ResetCodeExpiry: &expiry,
	}
}

func TestResetPassword_既存セッションを失効させる(t *testing.T) {
	now := time.Now()
	u := userWithResetCode(now, "654321")
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc, tm := revocationTestUsecase(repo, now)

	// 攻撃者が握っているトークン。再設定の前に発行されたもの
	stolen, err := tm.Generate(u.ID, u.Email, u.TokenVersion, now)
	if err != nil {
		t.Fatalf("トークン発行: %v", err)
	}
	if _, err := tm.Verify(stolen); err != nil {
		t.Fatalf("再設定前は有効であるべき: %v", err)
	}

	if err := uc.ResetPassword(context.Background(), "victim@example.com", "654321", "newpassword2"); err != nil {
		t.Fatalf("再設定に失敗: %v", err)
	}

	claims, err := tm.Verify(stolen)
	if err != nil {
		t.Fatalf("署名自体は有効なはず: %v", err)
	}
	if claims.TokenVersion == u.TokenVersion {
		t.Fatal("版番号が繰り上がっていない。パスワードを変えても攻撃者を追い出せない")
	}
}

func TestResetPassword_版番号を繰り上げる(t *testing.T) {
	now := time.Now()
	u := userWithResetCode(now, "654321")
	before := u.TokenVersion
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc, _ := revocationTestUsecase(repo, now)

	if err := uc.ResetPassword(context.Background(), "victim@example.com", "654321", "newpassword2"); err != nil {
		t.Fatalf("再設定に失敗: %v", err)
	}

	if u.TokenVersion != before+1 {
		t.Errorf("TokenVersion = %d, want %d", u.TokenVersion, before+1)
	}
}

// 失敗した再設定でセッションが切れると、第三者がでたらめなコードを
// 送りつけるだけで任意の利用者を締め出せてしまう
func TestResetPassword_失敗では版番号を動かさない(t *testing.T) {
	now := time.Now()
	u := userWithResetCode(now, "654321")
	before := u.TokenVersion
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc, _ := revocationTestUsecase(repo, now)

	_ = uc.ResetPassword(context.Background(), "victim@example.com", "000000", "newpassword2")

	if u.TokenVersion != before {
		t.Errorf("誤ったコードで版番号が動いた: %d -> %d", before, u.TokenVersion)
	}
}

func TestResetPassword_再設定後に発行したトークンは通る(t *testing.T) {
	now := time.Now()
	u := userWithResetCode(now, "654321")
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc, tm := revocationTestUsecase(repo, now)

	if err := uc.ResetPassword(context.Background(), "victim@example.com", "654321", "newpassword2"); err != nil {
		t.Fatalf("再設定に失敗: %v", err)
	}

	fresh, err := tm.Generate(u.ID, u.Email, u.TokenVersion, now)
	if err != nil {
		t.Fatalf("トークン発行: %v", err)
	}
	claims, err := tm.Verify(fresh)
	if err != nil {
		t.Fatalf("再設定後のトークンが無効: %v", err)
	}
	if claims.TokenVersion != u.TokenVersion {
		t.Errorf("TokenVersion = %d, want %d", claims.TokenVersion, u.TokenVersion)
	}
}

// ログインで発行するトークンにも現在の版番号が載っていなければ、
// 直後のリクエストで自分自身が弾かれる
func TestLogin_発行するトークンに現在の版番号を載せる(t *testing.T) {
	now := time.Now()
	hashed, _ := auth.HashPassword("password123")
	u := &entity.User{
		ID: "u-2", Email: "user@example.com", Password: hashed,
		CharacterType: "cat", EmailVerified: true, TokenVersion: 3,
	}
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc, tm := revocationTestUsecase(repo, now)

	token, _, err := uc.Login(context.Background(), "user@example.com", "password123")
	if err != nil {
		t.Fatalf("ログインに失敗: %v", err)
	}

	claims, err := tm.Verify(token)
	if err != nil {
		t.Fatalf("検証: %v", err)
	}
	if claims.TokenVersion != 3 {
		t.Errorf("TokenVersion = %d, want 3", claims.TokenVersion)
	}
}

func TestVerify_発行するトークンに現在の版番号を載せる(t *testing.T) {
	now := time.Now()
	code := "123456"
	expiry := now.Add(10 * time.Minute)
	u := &entity.User{
		ID: "u-3", Email: "pending@example.com", Password: "$2a$12$x",
		CharacterType: "cat", TokenVersion: 7,
		VerificationCode: &code, VerificationExpiry: &expiry,
	}
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc, tm := revocationTestUsecase(repo, now)

	token, _, err := uc.Verify(context.Background(), "pending@example.com", "123456")
	if err != nil {
		t.Fatalf("認証に失敗: %v", err)
	}

	claims, err := tm.Verify(token)
	if err != nil {
		t.Fatalf("検証: %v", err)
	}
	if claims.TokenVersion != 7 {
		t.Errorf("TokenVersion = %d, want 7", claims.TokenVersion)
	}
}
