package usecase

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"healthfamily/internal/pkg/auth"
	"healthfamily/internal/pkg/googleauth"
)

// 認可コードグラントでのログイン。
//
// ブラウザには一度きりの認可コードしか渡らず、ID トークンへの交換は
// client_secret を持つサーバーだけが行える。ID トークンをブラウザに置く
// 方式より、盗み見や保存の事故に強い。

// 交換に渡された内容を記録する偽物。ID トークンの検証にも記録が要るので、
// 既存の fakeGoogleVerifier ではなくこちらで受け取った資格情報を控える。
type recordingVerifier struct {
	claims     *googleauth.Claims
	err        error
	credential string
}

func (r *recordingVerifier) Verify(_ context.Context, credential string) (*googleauth.Claims, error) {
	r.credential = credential
	return r.claims, r.err
}

type stubExchanger struct {
	gotGrant googleauth.CodeGrant
	idToken  string
	err      error
	calls    int
}

func (s *stubExchanger) Exchange(_ context.Context, grant googleauth.CodeGrant) (string, error) {
	s.calls++
	s.gotGrant = grant
	return s.idToken, s.err
}

func validGrant() googleauth.CodeGrant {
	return googleauth.CodeGrant{
		Code:         "the-code",
		CodeVerifier: strings.Repeat("v", 43),
		RedirectURI:  "https://app.example.com/auth/callback",
	}
}

func newCodeGrantUsecase(
	repo *fakeUserRepo, v googleauth.Verifier, ex googleauth.Exchanger,
) *AuthUsecase {
	tm := auth.NewTokenManager("test-secret-test-secret-test-secret", time.Hour)
	uc := NewAuthUsecase(repo, tm, nil, v)
	uc.WithGoogleExchanger(ex)
	return uc
}

func TestLoginWithGoogleCode_交換してから検証する(t *testing.T) {
	repo := &fakeUserRepo{}
	verifier := &recordingVerifier{claims: &googleauth.Claims{
		Sub: "sub-1", Email: "user@example.com", EmailVerified: true,
	}}
	exchanger := &stubExchanger{idToken: "exchanged-id-token"}
	uc := newCodeGrantUsecase(repo, verifier, exchanger)

	token, user, err := uc.LoginWithGoogleCode(context.Background(), validGrant())
	if err != nil {
		t.Fatalf("ログインに失敗: %v", err)
	}

	if exchanger.calls != 1 {
		t.Errorf("交換の回数 = %d, want 1", exchanger.calls)
	}
	if exchanger.gotGrant != validGrant() {
		t.Errorf("交換に渡した内容が違う: %+v", exchanger.gotGrant)
	}
	if verifier.credential != "exchanged-id-token" {
		t.Errorf("検証したのは %q。交換で得た ID トークンを検証していない", verifier.credential)
	}
	if token == "" || user == nil {
		t.Fatal("トークンと利用者が返っていない")
	}
	if user.Email != "user@example.com" {
		t.Errorf("email = %q", user.Email)
	}
}

func TestLoginWithGoogleCode_壊れた入力はGoogleまで運ばない(t *testing.T) {
	repo := &fakeUserRepo{}
	exchanger := &stubExchanger{idToken: "x"}
	uc := newCodeGrantUsecase(repo, &recordingVerifier{}, exchanger)

	grant := validGrant()
	grant.CodeVerifier = "too-short"

	if _, _, err := uc.LoginWithGoogleCode(context.Background(), grant); err == nil {
		t.Fatal("短い code_verifier を受け入れている")
	}
	if exchanger.calls != 0 {
		t.Error("形式が壊れた入力を Google まで運んでいる")
	}
}

func TestLoginWithGoogleCode_交換失敗の詳細を漏らさない(t *testing.T) {
	repo := &fakeUserRepo{}
	verifier := &recordingVerifier{}
	exchanger := &stubExchanger{err: errors.New("google said invalid_grant for client 1234")}
	uc := newCodeGrantUsecase(repo, verifier, exchanger)

	_, _, err := uc.LoginWithGoogleCode(context.Background(), validGrant())
	if err == nil {
		t.Fatal("交換に失敗したのに成功として扱っている")
	}
	if strings.Contains(err.Error(), "1234") || strings.Contains(err.Error(), "invalid_grant") {
		t.Errorf("Google の応答をそのまま利用者に返している: %v", err)
	}
	if verifier.credential != "" {
		t.Error("交換に失敗したのに検証まで進んでいる")
	}
}

func TestLoginWithGoogleCode_未設定なら無効(t *testing.T) {
	repo := &fakeUserRepo{}
	uc := newCodeGrantUsecase(repo, &recordingVerifier{}, nil)

	if _, _, err := uc.LoginWithGoogleCode(context.Background(), validGrant()); err == nil {
		t.Fatal("未設定でも動くように見せている")
	}
}

func TestLoginWithGoogleCode_メール未確認は拒否(t *testing.T) {
	repo := &fakeUserRepo{}
	verifier := &recordingVerifier{claims: &googleauth.Claims{
		Sub: "sub-2", Email: "unverified@example.com", EmailVerified: false,
	}}
	uc := newCodeGrantUsecase(repo, verifier, &stubExchanger{idToken: "t"})

	if _, _, err := uc.LoginWithGoogleCode(context.Background(), validGrant()); err == nil {
		t.Fatal("Google 側で未確認のメールを受け入れている")
	}
	if repo.created != 0 {
		t.Error("未確認のまま利用者を作っている")
	}
}
