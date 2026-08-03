// Package googleauth は Google Identity Services の ID トークン (OIDC) を検証する。
package googleauth

import (
	"context"
	"fmt"

	"google.golang.org/api/idtoken"
)

// Claims は検証済み ID トークンから取り出すユーザー情報
type Claims struct {
	Sub           string // Google の安定ユーザーID (subject)
	Email         string
	EmailVerified bool
	Name          *string
}

// Verifier は Google ID トークンの検証の抽象 (テストで差し替え可能にする)
type Verifier interface {
	Verify(ctx context.Context, credential string) (*Claims, error)
}

type verifier struct {
	clientID string
}

// New は Google 公開鍵 (JWKS) で ID トークンを検証する Verifier を返す。
// audience が clientID と一致しないトークンは拒否される。
func New(clientID string) Verifier {
	return &verifier{clientID: clientID}
}

func (v *verifier) Verify(ctx context.Context, credential string) (*Claims, error) {
	payload, err := idtoken.Validate(ctx, credential, v.clientID)
	if err != nil {
		return nil, fmt.Errorf("validate id token: %w", err)
	}
	sub, _ := payload.Claims["sub"].(string)
	email, _ := payload.Claims["email"].(string)
	verified, _ := payload.Claims["email_verified"].(bool)
	if sub == "" || email == "" {
		return nil, fmt.Errorf("id token missing sub/email")
	}
	claims := &Claims{Sub: sub, Email: email, EmailVerified: verified}
	if name, ok := payload.Claims["name"].(string); ok && name != "" {
		claims.Name = &name
	}
	return claims, nil
}
