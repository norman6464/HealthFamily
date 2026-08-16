package usecase

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/pkg/auth"
)

// passwordVerifierSpy はパスワード照合に渡されたハッシュを記録する。
// 実測時間で判定するテストは環境依存で不安定なため、
// 「bcryptが必ず1回・実在するハッシュに対して走ったか」を代わりに観測する。
type passwordVerifierSpy struct {
	hashes []string
	result bool
}

func (s *passwordVerifierSpy) verify(hashed, _ string) bool {
	s.hashes = append(s.hashes, hashed)
	return s.result
}

func newLoginUsecase(users []*entity.User, spy *passwordVerifierSpy) *AuthUsecase {
	uc := NewAuthUsecase(
		&fakeUserRepo{users: users},
		auth.NewTokenManager("test-secret-0123456789abcdef", time.Hour),
		nil, nil,
	)
	if spy != nil {
		uc.verifyPassword = spy.verify
	}
	return uc
}

// bcryptHashLen は modular crypt 形式の bcrypt ハッシュの長さ。
// 桁が欠けた値は bcrypt が鍵導出に入る前に弾くため、コストを払ったことにならない。
const bcryptHashLen = 60

func assertBcryptRanOnce(t *testing.T, hashes []string) {
	t.Helper()
	if len(hashes) != 1 {
		t.Fatalf("パスワード照合の呼び出し回数 = %d, want 1 (0回だと応答が速くなり登録の有無が漏れる)", len(hashes))
	}
	if len(hashes[0]) != bcryptHashLen || !strings.HasPrefix(hashes[0], "$2") {
		t.Fatalf("bcryptハッシュとして成立しない値で照合している (%d文字): %q", len(hashes[0]), hashes[0])
	}
}

func TestLogin_未登録メールでもパスワード照合を1回走らせる(t *testing.T) {
	spy := &passwordVerifierSpy{}
	uc := newLoginUsecase(nil, spy)

	if _, _, err := uc.Login(context.Background(), "nobody@example.test", "password123"); err == nil {
		t.Fatal("未登録メールのログインは拒否されるべき")
	}
	assertBcryptRanOnce(t, spy.hashes)
}

// Googleログイン専用アカウントは Password が空。ここで bcrypt が即失敗すると
// 「未登録」と「Google専用アカウント」の区別まで応答時間から読み取れてしまう。
func TestLogin_Googleログイン専用アカウントでもパスワード照合を1回走らせる(t *testing.T) {
	spy := &passwordVerifierSpy{result: true}
	u := &entity.User{ID: "g1", Email: "google@example.test", Password: "", EmailVerified: true}
	uc := newLoginUsecase([]*entity.User{u}, spy)

	if _, _, err := uc.Login(context.Background(), "google@example.test", "password123"); err == nil {
		t.Fatal("パスワード未設定のアカウントにパスワードでログインできてはならない")
	}
	assertBcryptRanOnce(t, spy.hashes)
}

func TestLogin_登録済みでも未登録でも照合回数とメッセージが同じ(t *testing.T) {
	hashed, err := auth.HashPassword("correct-password")
	if err != nil {
		t.Fatalf("ハッシュ化に失敗: %v", err)
	}
	known := &entity.User{ID: "u1", Email: "known@example.test", Password: hashed, EmailVerified: true}

	knownSpy := &passwordVerifierSpy{}
	_, _, errKnown := newLoginUsecase([]*entity.User{known}, knownSpy).
		Login(context.Background(), "known@example.test", "wrong-password")

	unknownSpy := &passwordVerifierSpy{}
	_, _, errUnknown := newLoginUsecase([]*entity.User{known}, unknownSpy).
		Login(context.Background(), "unknown@example.test", "wrong-password")

	if errKnown == nil || errUnknown == nil {
		t.Fatal("どちらも拒否されるべき")
	}
	if errKnown.Error() != errUnknown.Error() {
		t.Fatalf("メッセージが異なると存在有無が漏れる: %q vs %q", errKnown.Error(), errUnknown.Error())
	}
	assertBcryptRanOnce(t, knownSpy.hashes)
	assertBcryptRanOnce(t, unknownSpy.hashes)
}

// 差し替え口は nil でも本物の bcrypt 照合へ落ちなければならない。
// NewAuthUsecase を通さず AuthUsecase{...} を直接組まれたときに、
// nil 呼び出しで落ちたり、照合が素通りになったりするのを防ぐ。
func TestLogin_構造体リテラルで組んでも本物の照合が働く(t *testing.T) {
	hashed, err := auth.HashPassword("correct-password")
	if err != nil {
		t.Fatalf("ハッシュ化に失敗: %v", err)
	}
	u := &entity.User{ID: "u1", Email: "user@example.test", Password: hashed, EmailVerified: true}
	uc := &AuthUsecase{
		users:  &fakeUserRepo{users: []*entity.User{u}},
		tokens: auth.NewTokenManager("test-secret-0123456789abcdef", time.Hour),
		now:    time.Now,
	}

	if _, _, err := uc.Login(context.Background(), "user@example.test", "correct-password"); err != nil {
		t.Fatalf("正しいパスワードが拒否された: %v", err)
	}
	if _, _, err := uc.Login(context.Background(), "user@example.test", "wrong-password"); err == nil {
		t.Fatal("誤ったパスワードが通った。照合が素通りしている")
	}
}

func TestLogin_正しいパスワードでログインできる(t *testing.T) {
	hashed, err := auth.HashPassword("correct-password")
	if err != nil {
		t.Fatalf("ハッシュ化に失敗: %v", err)
	}
	u := &entity.User{ID: "u1", Email: "user@example.test", Password: hashed, EmailVerified: true}
	uc := newLoginUsecase([]*entity.User{u}, nil)

	token, got, err := uc.Login(context.Background(), " User@Example.test ", "correct-password")
	if err != nil {
		t.Fatalf("正しいパスワードが拒否された: %v", err)
	}
	if token == "" || got == nil || got.ID != "u1" {
		t.Fatalf("トークンとユーザーが返るべき: token=%q user=%v", token, got)
	}
}

func TestLogin_誤ったパスワードを拒否する(t *testing.T) {
	hashed, err := auth.HashPassword("correct-password")
	if err != nil {
		t.Fatalf("ハッシュ化に失敗: %v", err)
	}
	u := &entity.User{ID: "u1", Email: "user@example.test", Password: hashed, EmailVerified: true}
	uc := newLoginUsecase([]*entity.User{u}, nil)

	_, _, err = uc.Login(context.Background(), "user@example.test", "wrong-password")
	var validation *domain.ValidationError
	if !errors.As(err, &validation) {
		t.Fatalf("ValidationError を期待したが %T (%v)", err, err)
	}
}

func TestLogin_メール未認証は拒否する(t *testing.T) {
	hashed, err := auth.HashPassword("correct-password")
	if err != nil {
		t.Fatalf("ハッシュ化に失敗: %v", err)
	}
	u := &entity.User{ID: "u1", Email: "user@example.test", Password: hashed, EmailVerified: false}
	uc := newLoginUsecase([]*entity.User{u}, nil)

	_, _, err = uc.Login(context.Background(), "user@example.test", "correct-password")
	var forbidden *domain.ForbiddenError
	if !errors.As(err, &forbidden) {
		t.Fatalf("ForbiddenError を期待したが %T (%v)", err, err)
	}
}
