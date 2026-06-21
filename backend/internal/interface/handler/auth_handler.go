package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// AuthHandler は認証エンドポイント
type AuthHandler struct {
	uc *usecase.AuthUsecase
}

func NewAuthHandler(uc *usecase.AuthUsecase) *AuthHandler {
	return &AuthHandler{uc: uc}
}

type signUpRequest struct {
	Email       string  `json:"email" binding:"required,email"`
	Password    string  `json:"password" binding:"required,min=8"`
	DisplayName *string `json:"displayName"`
}

func (h *AuthHandler) SignUp(c *gin.Context) {
	var req signUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	if err := h.uc.SignUp(c.Request.Context(), req.Email, req.Password, req.DisplayName); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, gin.H{"email": req.Email, "requiresVerification": true})
}

type verifyRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required"`
}

func (h *AuthHandler) Verify(c *gin.Context) {
	var req verifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	token, user, err := h.uc.Verify(c.Request.Context(), req.Email, req.Code)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"token": token, "user": user})
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	token, user, err := h.uc.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"token": token, "user": user})
}

type emailRequest struct {
	Email string `json:"email" binding:"required,email"`
}

func (h *AuthHandler) ResendCode(c *gin.Context) {
	var req emailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	if err := h.uc.ResendCode(c.Request.Context(), req.Email); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req emailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	if err := h.uc.ForgotPassword(c.Request.Context(), req.Email); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}

type resetPasswordRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Code     string `json:"code" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req resetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	if err := h.uc.ResetPassword(c.Request.Context(), req.Email, req.Code, req.Password); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
