package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"healthfamily/internal/pkg/auth"
	"healthfamily/internal/pkg/response"
)

// ContextUserID は認証済みユーザーIDをコンテキストに格納するキー
const ContextUserID = "userID"

// Auth はAuthorization: Bearer のJWTを検証しuserIDをコンテキストに入れる
func Auth(tm *auth.TokenManager) gin.HandlerFunc {
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
