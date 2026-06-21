package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// NotificationSettingHandler は通知設定エンドポイント
type NotificationSettingHandler struct {
	uc *usecase.NotificationSettingUsecase
}

func NewNotificationSettingHandler(uc *usecase.NotificationSettingUsecase) *NotificationSettingHandler {
	return &NotificationSettingHandler{uc: uc}
}

func (h *NotificationSettingHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	v, err := h.uc.Get(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

type upsertNotificationSettingRequest struct {
	PushEnabled     *bool `json:"pushEnabled"`
	EmailEnabled    *bool `json:"emailEnabled"`
	ReminderEnabled *bool `json:"reminderEnabled"`
}

func (h *NotificationSettingHandler) Upsert(c *gin.Context) {
	userID := middleware.UserID(c)
	var req upsertNotificationSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	v, err := h.uc.Upsert(c.Request.Context(), repository.UpsertNotificationSettingInput{
		UserID:          userID,
		PushEnabled:     req.PushEnabled,
		EmailEnabled:    req.EmailEnabled,
		ReminderEnabled: req.ReminderEnabled,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}
