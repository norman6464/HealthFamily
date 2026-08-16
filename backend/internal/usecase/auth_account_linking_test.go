package usecase

import (
	"context"
	"testing"
	"time"

	"healthfamily/internal/domain/entity"
	"healthfamily/internal/pkg/auth"
	"healthfamily/internal/pkg/googleauth"
)

// 同じメールアドレスなら、パスワード認証でも Google でも同じアカウントに紐づく。
//
// ただし「同じアドレスだから同じ人」と言えるのは、双方がそのメールボックスを
// 使えることを示した場合だけ。示していない側の資格情報を残したまま統合すると、
// 先に登録しておくだけで他人のアカウントを乗っ取れる。

func linkingUsecase(repo *fakeUserRepo, claims *googleauth.Claims) (*AuthUsecase, *recordingMailer) {
	tm := auth.NewTokenManager("test-secret-test-secret-test-secret", time.Hour)
	mailer := &recordingMailer{}
	uc := NewAuthUsecase(repo, tm, mailer, &recordingVerifier{claims: claims})
	uc.now = func() time.Time { return time.Now() }
	return uc, mailer
}

func googleClaims(email string) *googleauth.Claims {
	return &googleauth.Claims{Sub: "sub-" + email, Email: email, EmailVerified: true, Name: strPtr("本人")}
}

// 攻撃の再現。被害者が登録する前に、攻撃者がそのアドレスで登録だけ済ませておく。
func TestGoogleログイン_未認証アカウントの他人のパスワードを引き継がない(t *testing.T) {
	repo := &fakeUserRepo{}
	uc, _ := linkingUsecase(repo, googleClaims("victim@example.com"))

	// 攻撃者が被害者のアドレスで登録する。メールは被害者に届くので認証はできない
	if err := uc.SignUp(context.Background(), "victim@example.com", "attackerpass1", nil); err != nil {
		t.Fatalf("signup: %v", err)
	}

	// 被害者が Google でログインする
	if _, _, err := uc.LoginWithGoogle(context.Background(), "id-token"); err != nil {
		t.Fatalf("google login: %v", err)
	}

	if _, _, err := uc.Login(context.Background(), "victim@example.com", "attackerpass1"); err == nil {
		t.Fatal("攻撃者が自分のパスワードで被害者のアカウントに入れてしまう")
	}
	if repo.users[0].Password != "" {
		t.Error("所有を示していないパスワードが残っている")
	}
}

func TestGoogleログイン_未認証アカウントでも同じアカウントに紐づく(t *testing.T) {
	repo := &fakeUserRepo{}
	uc, _ := linkingUsecase(repo, googleClaims("user@example.com"))

	if err := uc.SignUp(context.Background(), "user@example.com", "password1234", nil); err != nil {
		t.Fatalf("signup: %v", err)
	}
	before := repo.users[0].ID

	_, u, err := uc.LoginWithGoogle(context.Background(), "id-token")
	if err != nil {
		t.Fatalf("google login: %v", err)
	}

	if len(repo.users) != 1 {
		t.Fatalf("アカウントが %d 件に増えた。統合されていない", len(repo.users))
	}
	if u.ID != before {
		t.Errorf("別のアカウントになった: %s -> %s", before, u.ID)
	}
	if u.GoogleID == nil {
		t.Error("Google が紐づいていない")
	}
	if !u.EmailVerified {
		t.Error("Google が所有を示しているのに未認証のまま")
	}
}

// 認証済みのアカウントは、本人がそのメールボックスを使えることを既に示している。
// Google 側も同じアドレスの所有を示しているので、同一人物とみなしてよい。
// この場合はパスワードを残す。消すと、本人が使っていた認証手段を奪うことになる。
func TestGoogleログイン_認証済みアカウントのパスワードは残す(t *testing.T) {
	repo := &fakeUserRepo{}
	uc, _ := linkingUsecase(repo, googleClaims("user@example.com"))

	if err := uc.SignUp(context.Background(), "user@example.com", "password1234", nil); err != nil {
		t.Fatalf("signup: %v", err)
	}
	code := *repo.users[0].VerificationCode
	if _, _, err := uc.Verify(context.Background(), "user@example.com", code); err != nil {
		t.Fatalf("verify: %v", err)
	}

	if _, _, err := uc.LoginWithGoogle(context.Background(), "id-token"); err != nil {
		t.Fatalf("google login: %v", err)
	}

	if _, _, err := uc.Login(context.Background(), "user@example.com", "password1234"); err != nil {
		t.Errorf("本人のパスワードログインが奪われた: %v", err)
	}
	if repo.users[0].GoogleID == nil {
		t.Error("Google が紐づいていない")
	}
}

// Google で作られたアカウントに、後からパスワードを足せること。
// 足す手段は「メールに届いたコードを示す」に限る。示さずに足せると、
// アドレスを知っているだけで他人のアカウントにパスワードを設定できる。
func TestGoogleで作ったアカウントに後からパスワードを設定できる(t *testing.T) {
	repo := &fakeUserRepo{}
	uc, mailer := linkingUsecase(repo, googleClaims("google@example.com"))

	if _, _, err := uc.LoginWithGoogle(context.Background(), "id-token"); err != nil {
		t.Fatalf("google login: %v", err)
	}
	if repo.users[0].Password != "" {
		t.Fatal("Google 専用アカウントにパスワードが入っている")
	}

	if err := uc.ForgotPassword(context.Background(), "google@example.com"); err != nil {
		t.Fatalf("forgot: %v", err)
	}
	if len(mailer.resets) == 0 {
		t.Fatal("再設定コードが送られていない")
	}
	code := *repo.users[0].ResetCode
	if err := uc.ResetPassword(context.Background(), "google@example.com", code, "newpassword12"); err != nil {
		t.Fatalf("reset: %v", err)
	}

	_, u, err := uc.Login(context.Background(), "google@example.com", "newpassword12")
	if err != nil {
		t.Fatalf("設定したパスワードでログインできない: %v", err)
	}
	if len(repo.users) != 1 {
		t.Errorf("アカウントが %d 件に増えた", len(repo.users))
	}
	if u.GoogleID == nil {
		t.Error("Google の紐付けが外れた")
	}
}

// 登録済みのアドレスで signup を叩かれても、アカウントを分裂させない
func TestSignUp_Googleで作ったアカウントを分裂させない(t *testing.T) {
	repo := &fakeUserRepo{}
	uc, _ := linkingUsecase(repo, googleClaims("google@example.com"))

	if _, _, err := uc.LoginWithGoogle(context.Background(), "id-token"); err != nil {
		t.Fatalf("google login: %v", err)
	}

	if err := uc.SignUp(context.Background(), "google@example.com", "attackerpass1", nil); err != nil {
		t.Fatalf("signup: %v", err)
	}

	if len(repo.users) != 1 {
		t.Fatalf("アカウントが %d 件に増えた", len(repo.users))
	}
	if repo.users[0].Password != "" {
		t.Error("アドレスを知っているだけでパスワードを設定できてしまう")
	}
}

var _ = entity.User{}

// 逆向きの乗っ取り。攻撃者が自分の Google アカウントで、
// 被害者のアドレスを名乗れないこと。
func TestGoogleログイン_所有を示していないアドレスでは紐づかない(t *testing.T) {
	repo := &fakeUserRepo{}
	// Google 側が「このアドレスの所有は未確認」と言っている
	claims := googleClaims("victim@example.com")
	claims.EmailVerified = false
	uc, _ := linkingUsecase(repo, claims)

	if err := uc.SignUp(context.Background(), "victim@example.com", "victimpass123", nil); err != nil {
		t.Fatalf("signup: %v", err)
	}
	code := *repo.users[0].VerificationCode
	if _, _, err := uc.Verify(context.Background(), "victim@example.com", code); err != nil {
		t.Fatalf("verify: %v", err)
	}

	if _, _, err := uc.LoginWithGoogle(context.Background(), "id-token"); err == nil {
		t.Fatal("所有未確認のアドレスで他人のアカウントに入れてしまう")
	}
	if repo.users[0].GoogleID != nil {
		t.Error("所有未確認なのに紐づいた")
	}
}

// 既に別の Google アカウントが紐づいているアドレスを、
// 後から別の sub で奪えないこと。
func TestGoogleログイン_別のGoogleアカウントで奪えない(t *testing.T) {
	repo := &fakeUserRepo{}
	uc, _ := linkingUsecase(repo, googleClaims("user@example.com"))
	if _, _, err := uc.LoginWithGoogle(context.Background(), "id-token"); err != nil {
		t.Fatalf("google login: %v", err)
	}
	original := *repo.users[0].GoogleID

	// 同じアドレスを名乗る別の Google アカウント
	attacker := &googleauth.Claims{
		Sub: "attacker-sub", Email: "user@example.com", EmailVerified: true,
	}
	uc2, _ := linkingUsecase(repo, attacker)
	_, u, err := uc2.LoginWithGoogle(context.Background(), "id-token")

	if err == nil && u != nil && *repo.users[0].GoogleID == "attacker-sub" {
		t.Fatal("別の Google アカウントに紐付けが差し替えられた")
	}
	if *repo.users[0].GoogleID != original {
		t.Errorf("紐付けが変わった: %s -> %s", original, *repo.users[0].GoogleID)
	}
}
