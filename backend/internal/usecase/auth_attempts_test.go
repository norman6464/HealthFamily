package usecase

import (
	"context"
	"testing"
	"time"

	"healthfamily/internal/domain/entity"
	"healthfamily/internal/pkg/auth"
)

// 送った宛先とコードを控えるだけの偽物
type recordingMailer struct {
	verifications []string
	resets        []string
}

func (m *recordingMailer) SendVerificationCode(_ context.Context, _, code string) error {
	m.verifications = append(m.verifications, code)
	return nil
}

func (m *recordingMailer) SendResetCode(_ context.Context, _, code string) error {
	m.resets = append(m.resets, code)
	return nil
}

func (m *recordingMailer) SendBudgetAlert(_ context.Context, _, _ string, _, _ int) error {
	return nil
}

// 6桁コードに対する、アカウント単位の総当たり防御。
//
// コードは100万通りしかない。IP単位の制限だけでは、攻撃者がIPを分散させれば
// 現実的な時間で尽くせてしまう。"verificationAttempts" 列は最初から
// 用意されていたが、一度も加算されず判断にも使われていなかった。
//
// アカウントを凍結するのではなくコードを捨てるのは、凍結だと第三者が
// でたらめなコードを送りつけるだけで任意の利用者を締め出せてしまうため。
// コードを捨てる方式なら、本人は再送を受け取ればやり直せる。

func attemptsTestUsecase(repo *fakeUserRepo, now time.Time) *AuthUsecase {
	tm := auth.NewTokenManager("test-secret-test-secret-test-secret", time.Hour)
	uc := NewAuthUsecase(repo, tm, &recordingMailer{}, nil)
	uc.now = func() time.Time { return now }
	return uc
}

func pendingUser(now time.Time, code string) *entity.User {
	expiry := now.Add(10 * time.Minute)
	return &entity.User{
		ID:                 "u-1",
		Email:              "pending@example.com",
		Password:           "$2a$12$dummy",
		CharacterType:      "cat",
		EmailVerified:      false,
		VerificationCode:   &code,
		VerificationExpiry: &expiry,
	}
}

func resettableUser(now time.Time, code string) *entity.User {
	expiry := now.Add(10 * time.Minute)
	return &entity.User{
		ID:              "u-2",
		Email:           "user@example.com",
		Password:        "$2a$12$dummy",
		CharacterType:   "cat",
		EmailVerified:   true,
		ResetCode:       &code,
		ResetCodeExpiry: &expiry,
	}
}

func TestVerify_失敗を数える(t *testing.T) {
	now := time.Now()
	u := pendingUser(now, "123456")
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc := attemptsTestUsecase(repo, now)

	_, _, _ = uc.Verify(context.Background(), "pending@example.com", "000000")
	_, _, _ = uc.Verify(context.Background(), "pending@example.com", "000001")

	if u.VerificationAttempts != 2 {
		t.Errorf("VerificationAttempts = %d, want 2", u.VerificationAttempts)
	}
}

func TestVerify_失敗回数を保存する(t *testing.T) {
	now := time.Now()
	repo := &fakeUserRepo{users: []*entity.User{pendingUser(now, "123456")}}
	uc := attemptsTestUsecase(repo, now)

	_, _, _ = uc.Verify(context.Background(), "pending@example.com", "000000")

	if repo.updated == 0 {
		t.Error("保存しなければ、次のリクエストで数え直しになり上限が効かない")
	}
}

func TestVerify_上限を超えたらコードを捨てる(t *testing.T) {
	now := time.Now()
	u := pendingUser(now, "123456")
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc := attemptsTestUsecase(repo, now)

	for range MaxCodeAttempts {
		_, _, _ = uc.Verify(context.Background(), "pending@example.com", "000000")
	}

	if u.VerificationCode != nil {
		t.Error("上限に達してもコードが残っている。分散した総当たりを止められない")
	}
	if _, _, err := uc.Verify(context.Background(), "pending@example.com", "123456"); err == nil {
		t.Error("正しいコードがまだ通ってしまう")
	}
	if u.EmailVerified {
		t.Error("上限超過後に認証が通っている")
	}
}

func TestVerify_上限までは正しいコードで通る(t *testing.T) {
	now := time.Now()
	u := pendingUser(now, "123456")
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc := attemptsTestUsecase(repo, now)

	for range MaxCodeAttempts - 1 {
		_, _, _ = uc.Verify(context.Background(), "pending@example.com", "000000")
	}

	if _, _, err := uc.Verify(context.Background(), "pending@example.com", "123456"); err != nil {
		t.Errorf("上限内なのに拒否された: %v", err)
	}
	if !u.EmailVerified {
		t.Error("認証されていない")
	}
}

func TestVerify_成功したら回数が戻る(t *testing.T) {
	now := time.Now()
	u := pendingUser(now, "123456")
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc := attemptsTestUsecase(repo, now)

	_, _, _ = uc.Verify(context.Background(), "pending@example.com", "000000")
	_, _, _ = uc.Verify(context.Background(), "pending@example.com", "123456")

	if u.VerificationAttempts != 0 {
		t.Errorf("成功後も回数が残っている: %d", u.VerificationAttempts)
	}
}

func TestVerify_コードが無い相手への試行は数えない(t *testing.T) {
	now := time.Now()
	u := &entity.User{ID: "u-3", Email: "nocode@example.com", CharacterType: "cat"}
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc := attemptsTestUsecase(repo, now)

	_, _, _ = uc.Verify(context.Background(), "nocode@example.com", "000000")

	if u.VerificationAttempts != 0 {
		t.Error("当たりようのない試行まで数えている")
	}
	if repo.updated != 0 {
		t.Error("でたらめなアドレスを投げるだけで書き込みを起こせてしまう")
	}
}

func TestVerify_存在しない相手でも書き込まない(t *testing.T) {
	now := time.Now()
	repo := &fakeUserRepo{}
	uc := attemptsTestUsecase(repo, now)

	_, _, _ = uc.Verify(context.Background(), "nobody@example.com", "000000")

	if repo.updated != 0 || repo.created != 0 {
		t.Error("存在しない相手で DB に書いている")
	}
}

func TestResendCode_再送で回数が戻る(t *testing.T) {
	now := time.Now()
	u := pendingUser(now, "123456")
	u.VerificationAttempts = MaxCodeAttempts
	u.VerificationCode = nil
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc := attemptsTestUsecase(repo, now)

	if err := uc.ResendCode(context.Background(), "pending@example.com"); err != nil {
		t.Fatalf("再送に失敗: %v", err)
	}

	if u.VerificationAttempts != 0 {
		t.Errorf("再送しても回数が戻らない: %d。本人がやり直せなくなる", u.VerificationAttempts)
	}
	if u.VerificationCode == nil {
		t.Fatal("新しいコードが発行されていない")
	}
	if _, _, err := uc.Verify(context.Background(), "pending@example.com", *u.VerificationCode); err != nil {
		t.Errorf("再送後の新しいコードで認証できない: %v", err)
	}
}

func TestResetPassword_上限を超えたらコードを捨てる(t *testing.T) {
	now := time.Now()
	u := resettableUser(now, "654321")
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc := attemptsTestUsecase(repo, now)

	for range MaxCodeAttempts {
		_ = uc.ResetPassword(context.Background(), "user@example.com", "000000", "newpassword1")
	}

	if u.ResetCode != nil {
		t.Error("上限に達しても再設定コードが残っている")
	}
	if err := uc.ResetPassword(context.Background(), "user@example.com", "654321", "newpassword1"); err == nil {
		t.Error("正しいコードがまだ通ってしまう")
	}
	if u.Password != "$2a$12$dummy" {
		t.Error("パスワードが差し替わっている")
	}
}

func TestResetPassword_上限までは正しいコードで通る(t *testing.T) {
	now := time.Now()
	u := resettableUser(now, "654321")
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc := attemptsTestUsecase(repo, now)

	for range MaxCodeAttempts - 1 {
		_ = uc.ResetPassword(context.Background(), "user@example.com", "000000", "newpassword1")
	}

	if err := uc.ResetPassword(context.Background(), "user@example.com", "654321", "newpassword1"); err != nil {
		t.Errorf("上限内なのに拒否された: %v", err)
	}
	if u.Password == "$2a$12$dummy" {
		t.Error("パスワードが差し替わっていない")
	}
}

// 片方への攻撃で、もう片方まで本人が使えなくなってはならない
func TestResetとVerifyの回数は別々に数える(t *testing.T) {
	now := time.Now()
	code := "123456"
	expiry := now.Add(10 * time.Minute)
	resetCode := "654321"
	u := &entity.User{
		ID: "u-4", Email: "both@example.com", Password: "$2a$12$dummy", CharacterType: "cat",
		VerificationCode: &code, VerificationExpiry: &expiry,
		ResetCode: &resetCode, ResetCodeExpiry: &expiry,
	}
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc := attemptsTestUsecase(repo, now)

	for range MaxCodeAttempts {
		_ = uc.ResetPassword(context.Background(), "both@example.com", "000000", "newpassword1")
	}

	if _, _, err := uc.Verify(context.Background(), "both@example.com", "123456"); err != nil {
		t.Errorf("再設定への攻撃で、本人のメール認証まで巻き添えになっている: %v", err)
	}
}

// 期限切れのコードは当たりようがないので、試行として数えない。
// 数えると、期限切れを狙って書き込みだけを起こさせられる
func TestVerify_期限切れは数えない(t *testing.T) {
	now := time.Now()
	code := "123456"
	expiry := now.Add(-time.Minute)
	u := &entity.User{
		ID: "u-5", Email: "stale@example.com", CharacterType: "cat",
		VerificationCode: &code, VerificationExpiry: &expiry,
	}
	repo := &fakeUserRepo{users: []*entity.User{u}}
	uc := attemptsTestUsecase(repo, now)

	_, _, _ = uc.Verify(context.Background(), "stale@example.com", "123456")

	if u.VerificationAttempts != 0 {
		t.Errorf("期限切れを数えている: %d", u.VerificationAttempts)
	}
	if repo.updated != 0 {
		t.Error("期限切れのコードを狙って書き込みを起こせてしまう")
	}
}
