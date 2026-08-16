package usecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/pkg/auth"
)

// verifyUserRepo は Verify のテストに必要な最小のリポジトリ実装。
type verifyUserRepo struct {
	user    *entity.User
	updated *entity.User
}

func (r *verifyUserRepo) FindByEmail(_ context.Context, email string) (*entity.User, error) {
	if r.user != nil && r.user.Email == email {
		return r.user, nil
	}
	return nil, nil
}
func (r *verifyUserRepo) FindByID(context.Context, string) (*entity.User, error) { return nil, nil }
func (r *verifyUserRepo) FindByGoogleID(context.Context, string) (*entity.User, error) {
	return nil, nil
}
func (r *verifyUserRepo) Create(context.Context, *entity.User) error { return nil }
func (r *verifyUserRepo) Update(_ context.Context, u *entity.User) error {
	r.updated = u
	return nil
}

var _ repository.UserRepository = (*verifyUserRepo)(nil)

func newVerifyUsecase(u *entity.User) (*AuthUsecase, *verifyUserRepo) {
	repo := &verifyUserRepo{user: u}
	uc := NewAuthUsecase(repo, auth.NewTokenManager("test-secret-0123456789abcdef", time.Hour), nil, nil)
	return uc, repo
}

func verifiedUser() *entity.User {
	return &entity.User{
		ID:            "victim",
		Email:         "victim@example.test",
		Password:      "hashed",
		EmailVerified: true,
	}
}

// メールアドレスさえ知っていれば任意のコードでログインできてはならない。
// 認証済みユーザーに対してコード検証を飛ばすと、アカウント乗っ取りになる。
func TestVerify_認証済みユーザーへの不正なコードを拒否する(t *testing.T) {
	uc, _ := newVerifyUsecase(verifiedUser())

	token, user, err := uc.Verify(context.Background(), "victim@example.test", "000000")

	if err == nil {
		t.Fatalf("でたらめなコードが通ってしまった: token=%q user=%v", token, user)
	}
	var validation *domain.ValidationError
	if !asValidation(err, &validation) {
		t.Fatalf("ValidationError を期待したが %T (%v)", err, err)
	}
	if token != "" {
		t.Fatalf("トークンを発行してはならない: %q", token)
	}
}

// 認証済みかどうかを問わず、存在しないユーザーは同じ結果にする（列挙防止）。
func TestVerify_存在しないユーザーは同じメッセージで拒否する(t *testing.T) {
	uc, _ := newVerifyUsecase(verifiedUser())

	_, _, errUnknown := uc.Verify(context.Background(), "nobody@example.test", "000000")
	_, _, errVerified := uc.Verify(context.Background(), "victim@example.test", "000000")

	if errUnknown == nil || errVerified == nil {
		t.Fatal("どちらも拒否されるべき")
	}
	if errUnknown.Error() != errVerified.Error() {
		t.Fatalf("メッセージが異なると存在有無が漏れる: %q vs %q", errUnknown.Error(), errVerified.Error())
	}
}

// 正しいコードなら、未認証ユーザーは認証済みになってログインできる。
func TestVerify_正しいコードで認証が完了する(t *testing.T) {
	code := "123456"
	expiry := time.Now().Add(10 * time.Minute)
	u := &entity.User{
		ID:                 "u-1",
		Email:              "user@example.test",
		EmailVerified:      false,
		VerificationCode:   &code,
		VerificationExpiry: &expiry,
	}
	uc, repo := newVerifyUsecase(u)

	token, user, err := uc.Verify(context.Background(), "user@example.test", code)

	if err != nil {
		t.Fatalf("正しいコードが拒否された: %v", err)
	}
	if token == "" || user == nil {
		t.Fatal("トークンとユーザーが返るべき")
	}
	if repo.updated == nil || !repo.updated.EmailVerified {
		t.Fatal("emailVerified を true にして保存すべき")
	}
	if repo.updated.VerificationCode != nil || repo.updated.VerificationExpiry != nil {
		t.Fatal("使い終わったコードは消すべき")
	}
}

// 一度使ったコードは再利用できない。
func TestVerify_使用済みのコードは再利用できない(t *testing.T) {
	code := "123456"
	expiry := time.Now().Add(10 * time.Minute)
	u := &entity.User{
		ID:                 "u-2",
		Email:              "user2@example.test",
		EmailVerified:      false,
		VerificationCode:   &code,
		VerificationExpiry: &expiry,
	}
	uc, _ := newVerifyUsecase(u)

	if _, _, err := uc.Verify(context.Background(), "user2@example.test", code); err != nil {
		t.Fatalf("1回目は成功すべき: %v", err)
	}
	if _, _, err := uc.Verify(context.Background(), "user2@example.test", code); err == nil {
		t.Fatal("2回目は拒否すべき")
	}
}

// 期限切れのコードは通らない。
func TestVerify_期限切れのコードを拒否する(t *testing.T) {
	code := "123456"
	expiry := time.Now().Add(-1 * time.Minute)
	u := &entity.User{
		ID:                 "u-3",
		Email:              "user3@example.test",
		EmailVerified:      false,
		VerificationCode:   &code,
		VerificationExpiry: &expiry,
	}
	uc, _ := newVerifyUsecase(u)

	if _, _, err := uc.Verify(context.Background(), "user3@example.test", code); err == nil {
		t.Fatal("期限切れは拒否すべき")
	}
}

func asValidation(err error, target **domain.ValidationError) bool {
	return errors.As(err, target)
}

// 保持している利用者の版番号をそのまま返す。存在しなければ found=false。
func (r *verifyUserRepo) TokenVersion(ctx context.Context, id string) (int, bool, error) {
	u, err := r.FindByID(ctx, id)
	if err != nil || u == nil {
		return 0, false, err
	}
	return u.TokenVersion, true, nil
}
