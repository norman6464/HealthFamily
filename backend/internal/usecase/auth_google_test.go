package usecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/pkg/auth"
	"healthfamily/internal/pkg/googleauth"
)

// fakeUserRepo は UserRepository のインメモリ実装
type fakeUserRepo struct {
	users   []*entity.User
	created int
	updated int
}

func (f *fakeUserRepo) FindByEmail(_ context.Context, email string) (*entity.User, error) {
	for _, u := range f.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, nil
}

func (f *fakeUserRepo) FindByID(_ context.Context, id string) (*entity.User, error) {
	for _, u := range f.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, nil
}

func (f *fakeUserRepo) FindByGoogleID(_ context.Context, googleID string) (*entity.User, error) {
	for _, u := range f.users {
		if u.GoogleID != nil && *u.GoogleID == googleID {
			return u, nil
		}
	}
	return nil, nil
}

func (f *fakeUserRepo) Create(_ context.Context, u *entity.User) error {
	f.users = append(f.users, u)
	f.created++
	return nil
}

func (f *fakeUserRepo) Update(_ context.Context, u *entity.User) error {
	f.updated++
	return nil
}

// fakeGoogleVerifier は固定クレームを返す Verifier
type fakeGoogleVerifier struct {
	claims *googleauth.Claims
	err    error
}

func (f *fakeGoogleVerifier) Verify(_ context.Context, _ string) (*googleauth.Claims, error) {
	return f.claims, f.err
}

func newGoogleTestUsecase(repo *fakeUserRepo, v googleauth.Verifier) *AuthUsecase {
	tm := auth.NewTokenManager("test-secret-test-secret-test-secret", time.Hour)
	return NewAuthUsecase(repo, tm, nil, v)
}

func strPtr(s string) *string { return &s }

func TestLoginWithGoogle_新規ユーザーが作成される(t *testing.T) {
	repo := &fakeUserRepo{}
	uc := newGoogleTestUsecase(repo, &fakeGoogleVerifier{claims: &googleauth.Claims{
		Sub: "google-sub-1", Email: "New@Example.com", EmailVerified: true, Name: strPtr("太郎"),
	}})

	token, user, err := uc.LoginWithGoogle(context.Background(), "dummy-credential")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token == "" {
		t.Error("token が空")
	}
	if repo.created != 1 {
		t.Errorf("created = %d, want 1", repo.created)
	}
	if user.Email != "new@example.com" {
		t.Errorf("email = %q (小文字化されるべき)", user.Email)
	}
	if !user.EmailVerified {
		t.Error("EmailVerified が false")
	}
	if user.GoogleID == nil || *user.GoogleID != "google-sub-1" {
		t.Error("GoogleID が保存されていない")
	}
	if user.Password != "" {
		t.Error("Googleログイン専用ユーザーの Password は空であるべき")
	}
}

func TestLoginWithGoogle_既存メールのユーザーに紐付けされる(t *testing.T) {
	existing := &entity.User{ID: "u1", Email: "taro@example.com", Password: "hashed", EmailVerified: false}
	repo := &fakeUserRepo{users: []*entity.User{existing}}
	uc := newGoogleTestUsecase(repo, &fakeGoogleVerifier{claims: &googleauth.Claims{
		Sub: "google-sub-2", Email: "taro@example.com", EmailVerified: true,
	}})

	_, user, err := uc.LoginWithGoogle(context.Background(), "dummy")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.created != 0 || repo.updated != 1 {
		t.Errorf("created=%d updated=%d, want 0/1", repo.created, repo.updated)
	}
	if user.ID != "u1" {
		t.Errorf("既存ユーザーが返るべき: got %s", user.ID)
	}
	if user.GoogleID == nil || *user.GoogleID != "google-sub-2" {
		t.Error("GoogleID が紐付けされていない")
	}
	if !user.EmailVerified {
		t.Error("Google確認済みメールなので EmailVerified になるべき")
	}
}

func TestLoginWithGoogle_googleId一致なら即ログイン(t *testing.T) {
	existing := &entity.User{ID: "u2", Email: "hana@example.com", GoogleID: strPtr("google-sub-3"), EmailVerified: true}
	repo := &fakeUserRepo{users: []*entity.User{existing}}
	uc := newGoogleTestUsecase(repo, &fakeGoogleVerifier{claims: &googleauth.Claims{
		Sub: "google-sub-3", Email: "hana@example.com", EmailVerified: true,
	}})

	token, user, err := uc.LoginWithGoogle(context.Background(), "dummy")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token == "" || user.ID != "u2" {
		t.Errorf("既存Googleユーザーでログインできるべき: token=%q id=%s", token, user.ID)
	}
	if repo.created != 0 || repo.updated != 0 {
		t.Errorf("createもupdateも不要: created=%d updated=%d", repo.created, repo.updated)
	}
}

func TestLoginWithGoogle_メール未確認は拒否(t *testing.T) {
	repo := &fakeUserRepo{}
	uc := newGoogleTestUsecase(repo, &fakeGoogleVerifier{claims: &googleauth.Claims{
		Sub: "google-sub-4", Email: "x@example.com", EmailVerified: false,
	}})

	_, _, err := uc.LoginWithGoogle(context.Background(), "dummy")
	var de *domain.ForbiddenError
	if !errors.As(err, &de) {
		t.Fatalf("ForbiddenError を期待: %v", err)
	}
	if repo.created != 0 {
		t.Error("未確認メールでユーザー作成してはいけない")
	}
}

func TestLoginWithGoogle_検証失敗は認証エラー(t *testing.T) {
	repo := &fakeUserRepo{}
	uc := newGoogleTestUsecase(repo, &fakeGoogleVerifier{err: errors.New("bad token")})

	_, _, err := uc.LoginWithGoogle(context.Background(), "bad")
	if err == nil {
		t.Fatal("エラーを期待")
	}
}

func TestLoginWithGoogle_無効時はエラー(t *testing.T) {
	uc := newGoogleTestUsecase(&fakeUserRepo{}, nil)
	_, _, err := uc.LoginWithGoogle(context.Background(), "dummy")
	if err == nil {
		t.Fatal("Verifier未設定ならエラーを期待")
	}
}
