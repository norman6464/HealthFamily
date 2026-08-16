package middleware

import (
	"context"
	"errors"
	"strings"

	"github.com/gin-gonic/gin"
	"healthfamily/internal/pkg/auth"
	"healthfamily/internal/pkg/response"
)

// ContextUserID は認証済みユーザーIDをコンテキストに格納するキー
const ContextUserID = "userID"

// ErrUserNotFound は照合先の利用者が存在しないことを表す。
// 問い合わせ自体の失敗と区別する必要があるため、専用のエラーにしている。
var ErrUserNotFound = errors.New("user not found")

// TokenVersionLookup は保存されているトークン世代を引く。
//
// 署名が正しいだけでは失効を判定できない。パスワード再設定で繰り上げた値と
// 突き合わせて初めて、攻撃者が握っているトークンを拒める。
type TokenVersionLookup interface {
	// TokenVersion は利用者が存在しなければ ErrUserNotFound を返す。
	TokenVersion(ctx context.Context, userID string) (int, error)
}

// TokenVersionFunc は関数を TokenVersionLookup として使えるようにする。
// 永続化層がこの層を知る必要が無くなり、両者の結び付けを起動時に閉じ込められる。
type TokenVersionFunc func(ctx context.Context, userID string) (int, error)

func (f TokenVersionFunc) TokenVersion(ctx context.Context, userID string) (int, error) {
	return f(ctx, userID)
}

// Auth はAuthorization: Bearer のJWTを検証しuserIDをコンテキストに入れる。
//
// 署名の検証に加えて、トークンに載った世代が現在の値と一致するかを見る。
// ここを省くと、乗っ取られた利用者がパスワードを変えても攻撃者のトークンが
// 有効期限(7日)まで通り続ける。1リクエストあたり主キー1件の問い合わせが増えるが、
// 「パスワードを変えれば追い出せる」を成立させるにはこの照合が要る。
func Auth(tm *auth.TokenManager, versions TokenVersionLookup) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			response.Unauthorized(c)
			c.Abort()
			return
		}
		token := strings.TrimPrefix(header, "Bearer ")
		claims, err := tm.Verify(token)
		if err != nil {
			// 署名が通らないものは DB を引くまでもない。引くと、でたらめな
			// トークンを投げるだけで無認証のまま DB を叩けてしまう
			response.Unauthorized(c)
			c.Abort()
			return
		}

		current, err := versions.TokenVersion(c.Request.Context(), claims.UserID)
		switch {
		case errors.Is(err, ErrUserNotFound):
			// 退会・削除されたアカウントのトークンを生かしておかない
			response.Unauthorized(c)
			c.Abort()
			return
		case err != nil:
			// 障害を認証成功に倒すと、DB を落とせば誰でも入れてしまう。
			// かといって 401 にすると、利用者には「ログインし直せば直る」ように
			// 見えて何度やっても入れない。区別できる 503 を返す
			response.Unavailable(c)
			c.Abort()
			return
		}

		if claims.TokenVersion != current {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		c.Set(ContextUserID, claims.UserID)
		c.Next()
	}
}

// UserID はコンテキストから認証済みユーザーIDを取り出す
func UserID(c *gin.Context) string {
	v, _ := c.Get(ContextUserID)
	id, _ := v.(string)
	return id
}
