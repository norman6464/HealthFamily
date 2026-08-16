package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// ErrInvalidToken はトークン検証失敗時のエラー
var ErrInvalidToken = errors.New("invalid token")

// Claims はJWTのペイロード
type Claims struct {
	UserID string `json:"uid"`
	Email  string `json:"email"`
	// TokenVersion は発行時点の世代。保存されている値と食い違うトークンは失効扱いにする。
	// これが無いと、パスワードを再設定しても攻撃者のトークンが有効期限まで通り続ける。
	// クレームが無い古いトークンは 0 として読まれる (omitempty を付けない理由でもある)。
	TokenVersion int `json:"tv"`
	jwt.RegisteredClaims
}

// TokenManager はJWTの発行・検証を行う
type TokenManager struct {
	secret []byte
	ttl    time.Duration
}

// NewTokenManager は署名鍵と有効期限からマネージャを生成する
func NewTokenManager(secret string, ttl time.Duration) *TokenManager {
	return &TokenManager{secret: []byte(secret), ttl: ttl}
}

// Generate はユーザー向けのアクセストークンを発行する。
//
// tokenVersion には発行時点で保存されている値を渡すこと。古い値を渡すと、
// 発行した直後のリクエストで自分自身が失効扱いになる。
func (m *TokenManager) Generate(userID, email string, tokenVersion int, now time.Time) (string, error) {
	claims := Claims{
		UserID:       userID,
		Email:        email,
		TokenVersion: tokenVersion,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.ttl)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

// Verify はトークンを検証しクレームを返す
func (m *TokenManager) Verify(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return m.secret, nil
	})
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}
	return claims, nil
}
