package auth

import "golang.org/x/crypto/bcrypt"

// BcryptCost は本物のハッシュとダミーの両方が守るコスト (Next.js 実装と同等)。
//
// 数値をここ以外に書くと、片方だけ上げたときにダミーが安くなり、
// 「照合対象が無いときだけ応答が速い」という登録有無の漏れが戻る。
// DummyPasswordHash はこの値で作り直すこと (password_test.go が見張っている)。
const BcryptCost = 12

// HashPassword はパスワードをbcryptでハッシュ化する
func HashPassword(plain string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(plain), BcryptCost)
	return string(bytes), err
}

// VerifyPassword は平文とハッシュを比較する
func VerifyPassword(hashed, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(plain)) == nil
}

// DummyPasswordHash は照合対象のハッシュが無いときに VerifyPassword へ渡す身代わり。
// 対応する平文はランダム生成なので実質存在せず、常に不一致になる。
const DummyPasswordHash = "$2a$12$7OgpxKUj447TUBLao3sHcOli2AK8T3Tdvtu0ruvn/3IpulT7jHMXG"
