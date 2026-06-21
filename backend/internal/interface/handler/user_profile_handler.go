package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// UserProfileHandler はユーザープロフィールエンドポイント
type UserProfileHandler struct {
	uc *usecase.UserProfileUsecase
}

func NewUserProfileHandler(uc *usecase.UserProfileUsecase) *UserProfileHandler {
	return &UserProfileHandler{uc: uc}
}

func (h *UserProfileHandler) Me(c *gin.Context) {
	userID := middleware.UserID(c)
	u, err := h.uc.Get(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, u)
}

type updateProfileRequest struct {
	DisplayName   *string `json:"displayName"`
	CharacterType *string `json:"characterType"`
	CharacterName *string `json:"characterName"`
}

func (h *UserProfileHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	u, err := h.uc.Update(c.Request.Context(), userID, usecase.UpdateProfileInput{
		DisplayName:   req.DisplayName,
		CharacterType: req.CharacterType,
		CharacterName: req.CharacterName,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, u)
}
