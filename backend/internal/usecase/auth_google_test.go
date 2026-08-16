package usecase

import (
	"context"
	"errors"
	"healthfamily/internal/domain/repository"
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

// 保持している利用者の版番号をそのまま返す。存在しなければ found=false。
func (f *fakeUserRepo) TokenVersion(ctx context.Context, id string) (int, bool, error) {
	u, err := f.FindByID(ctx, id)
	if err != nil || u == nil {
		return 0, false, err
	}
	return u.TokenVersion, true, nil
}

// --- repository.UserRepository の資格情報系メソッド ---
// 本物と同じく、読み出したスナップショットを書き戻さない形で振る舞う。

func (f *fakeUserRepo) UpdateProfile(ctx context.Context, u *entity.User) error {
	cur, err := f.FindByID(ctx, u.ID)
	if err != nil || cur == nil {
		return err
	}
	cur.DisplayName = u.DisplayName
	cur.CharacterType = u.CharacterType
	cur.CharacterName = u.CharacterName
	f.updated++
	return nil
}

func (f *fakeUserRepo) SavePendingRegistration(ctx context.Context, id, hashed string, displayName *string, code string, expiry time.Time) error {
	u, err := f.FindByID(ctx, id)
	if err != nil || u == nil {
		return err
	}
	if u.EmailVerified {
		return repository.ErrAlreadyVerified
	}
	u.Password = hashed
	u.DisplayName = displayName
	u.VerificationCode = &code
	u.VerificationExpiry = &expiry
	u.VerificationAttempts = 0
	f.updated++
	return nil
}

func (f *fakeUserRepo) SaveVerificationCode(ctx context.Context, id, code string, expiry time.Time) error {
	u, err := f.FindByID(ctx, id)
	if err != nil || u == nil {
		return err
	}
	u.VerificationCode = &code
	u.VerificationExpiry = &expiry
	u.VerificationAttempts = 0
	f.updated++
	return nil
}

func (f *fakeUserRepo) MarkEmailVerified(ctx context.Context, id, verifiedCode string) error {
	u, err := f.FindByID(ctx, id)
	if err != nil || u == nil {
		return err
	}
	if u.VerificationCode == nil || *u.VerificationCode != verifiedCode {
		return repository.ErrCodeConsumed
	}
	u.EmailVerified = true
	u.VerificationCode = nil
	u.VerificationExpiry = nil
	u.VerificationAttempts = 0
	f.updated++
	return nil
}

func (f *fakeUserRepo) ClaimVerificationAttempt(ctx context.Context, id string, max int) (*string, *time.Time, bool, error) {
	u, err := f.FindByID(ctx, id)
	if err != nil || u == nil {
		return nil, nil, true, err
	}
	// 本物と同じ規則。生きているコードが無ければ消費しない
	if u.VerificationCode == nil || u.VerificationExpiry == nil || !u.VerificationExpiry.After(time.Now()) {
		return nil, nil, true, nil
	}
	code, expiry := u.VerificationCode, u.VerificationExpiry
	u.VerificationAttempts++
	if u.VerificationAttempts > max {
		u.VerificationCode = nil
		u.VerificationExpiry = nil
	}
	f.updated++
	if u.VerificationAttempts > max {
		return nil, nil, false, nil
	}
	return code, expiry, true, nil
}

func (f *fakeUserRepo) SaveResetCode(ctx context.Context, id, code string, expiry time.Time) error {
	u, err := f.FindByID(ctx, id)
	if err != nil || u == nil {
		return err
	}
	u.ResetCode = &code
	u.ResetCodeExpiry = &expiry
	u.ResetAttempts = 0
	f.updated++
	return nil
}

func (f *fakeUserRepo) ClaimResetAttempt(ctx context.Context, id string, max int) (*string, *time.Time, bool, error) {
	u, err := f.FindByID(ctx, id)
	if err != nil || u == nil {
		return nil, nil, true, err
	}
	// 本物と同じ規則。生きているコードが無ければ消費しない
	if u.ResetCode == nil || u.ResetCodeExpiry == nil || !u.ResetCodeExpiry.After(time.Now()) {
		return nil, nil, true, nil
	}
	code, expiry := u.ResetCode, u.ResetCodeExpiry
	u.ResetAttempts++
	if u.ResetAttempts > max {
		u.ResetCode = nil
		u.ResetCodeExpiry = nil
	}
	f.updated++
	if u.ResetAttempts > max {
		return nil, nil, false, nil
	}
	return code, expiry, true, nil
}

func (f *fakeUserRepo) ApplyPasswordReset(ctx context.Context, id, verifiedCode, hashed string) error {
	u, err := f.FindByID(ctx, id)
	if err != nil || u == nil {
		return err
	}
	if u.ResetCode == nil || *u.ResetCode != verifiedCode {
		return repository.ErrCodeConsumed
	}
	u.Password = hashed
	u.ResetCode = nil
	u.ResetCodeExpiry = nil
	u.ResetAttempts = 0
	u.TokenVersion++
	f.updated++
	return nil
}

func (f *fakeUserRepo) LinkGoogle(ctx context.Context, id, subject string, resetCredentials bool, displayName *string) error {
	u, err := f.FindByID(ctx, id)
	if err != nil || u == nil {
		return err
	}
	if resetCredentials {
		u.Password = ""
		u.DisplayName = displayName
		u.VerificationCode = nil
		u.VerificationExpiry = nil
		u.VerificationAttempts = 0
	}
	u.GoogleID = &subject
	u.EmailVerified = true
	f.updated++
	return nil
}
