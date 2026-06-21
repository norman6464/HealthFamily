package response

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	domainerr "healthfamily/internal/domain"
)

// APIレスポンス形式は Next.js 版と互換: { success, data?, error? }

// Success は200で成功レスポンスを返す
func Success(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

// Created は201で成功レスポンスを返す
func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": data})
}

// Error は任意ステータスでエラーレスポンスを返す
func Error(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"success": false, "error": message})
}

// Unauthorized は401を返す
func Unauthorized(c *gin.Context) {
	Error(c, http.StatusUnauthorized, "認証エラー")
}

// HandleDomainError はドメイン例外をHTTPステータスにマッピングする
func HandleDomainError(c *gin.Context, err error) {
	var notFound *domainerr.NotFoundError
	var conflict *domainerr.ConflictError
	var validation *domainerr.ValidationError
	var forbidden *domainerr.ForbiddenError

	switch {
	case errors.As(err, &notFound):
		Error(c, http.StatusNotFound, err.Error())
	case errors.As(err, &conflict):
		Error(c, http.StatusConflict, err.Error())
	case errors.As(err, &validation):
		Error(c, http.StatusBadRequest, err.Error())
	case errors.As(err, &forbidden):
		Error(c, http.StatusForbidden, err.Error())
	default:
		c.Error(err) //nolint:errcheck
		Error(c, http.StatusInternalServerError, "サーバーエラーが発生しました")
	}
}
