package auth

import "golang.org/x/crypto/bcrypt"

// HashPassword はパスワードをbcryptでハッシュ化する（cost=12、Next.js実装と同等）
func HashPassword(plain string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(plain), 12)
	return string(bytes), err
}

// VerifyPassword は平文とハッシュを比較する
func VerifyPassword(hashed, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(plain)) == nil
}
