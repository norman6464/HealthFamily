package auth

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

// ダミーハッシュのコストが本物と揃わなくなると、未登録メールのログインだけ
// 計算が軽くなり、応答時間からアドレスの登録有無が読み取れる。
// BcryptCost を上げたときにここが落ちれば、ダミーの張り替え忘れに気づける。
func TestDummyPasswordHash_コストが本物と揃っている(t *testing.T) {
	cost, err := bcrypt.Cost([]byte(DummyPasswordHash))
	if err != nil {
		t.Fatalf("bcryptハッシュとして解釈できない: %v", err)
	}
	if cost != BcryptCost {
		t.Fatalf("ダミーの cost = %d, BcryptCost = %d。"+
			"BcryptCost に合わせて DummyPasswordHash を作り直すこと", cost, BcryptCost)
	}
}

// HashPassword が BcryptCost を使わずに独自の数値へ戻ると、
// 上の照合が通っていてもダミーと本物のコストがずれる。
func TestHashPassword_BcryptCostで作られる(t *testing.T) {
	hashed, err := HashPassword("some-password")
	if err != nil {
		t.Fatalf("ハッシュ化に失敗: %v", err)
	}
	cost, err := bcrypt.Cost([]byte(hashed))
	if err != nil {
		t.Fatalf("bcryptハッシュとして解釈できない: %v", err)
	}
	if cost != BcryptCost {
		t.Fatalf("HashPassword の cost = %d, want %d", cost, BcryptCost)
	}
}

func TestDummyPasswordHash_どんなパスワードとも一致しない(t *testing.T) {
	for _, plain := range []string{"", "password", "123456", DummyPasswordHash} {
		if VerifyPassword(DummyPasswordHash, plain) {
			t.Fatalf("ダミーハッシュに一致してしまった: %q", plain)
		}
	}
}
