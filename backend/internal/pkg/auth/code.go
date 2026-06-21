package auth

import (
	"crypto/rand"
	"math/big"
)

// NewVerificationCode は6桁の数字コードを生成する
func NewVerificationCode() string {
	const digits = "0123456789"
	b := make([]byte, 6)
	for i := range b {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		b[i] = digits[n.Int64()]
	}
	return string(b)
}
