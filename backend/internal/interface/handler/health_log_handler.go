package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// HealthLogHandler は体調ログエンドポイント
type HealthLogHandler struct {
	uc *usecase.HealthLogUsecase
}

func NewHealthLogHandler(uc *usecase.HealthLogUsecase) *HealthLogHandler {
	return &HealthLogHandler{uc: uc}
}

func (h *HealthLogHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.List(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *HealthLogHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	v, err := h.uc.Get(c.Request.Context(), userID, c.Param("logId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

type createHealthLogRequest struct {
	MemberID       string   `json:"memberId" binding:"required"`
	ConditionLevel *int     `json:"conditionLevel" binding:"required"`
	Symptoms       []string `json:"symptoms"`
	Notes          *string  `json:"notes"`
	RecordedAt     *string  `json:"recordedAt"`
}

func (h *HealthLogHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createHealthLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "メンバーIDと体調レベルは必須です")
		return
	}
	v, err := h.uc.Create(c.Request.Context(), repository.CreateHealthLogInput{
		UserID:         userID,
		MemberID:       req.MemberID,
		ConditionLevel: *req.ConditionLevel,
		Symptoms:       req.Symptoms,
		Notes:          req.Notes,
		RecordedAt:     parseDate(req.RecordedAt),
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, v)
}

type updateHealthLogRequest struct {
	ConditionLevel *int     `json:"conditionLevel"`
	Symptoms       []string `json:"symptoms"`
	Notes          *string  `json:"notes"`
	RecordedAt     *string  `json:"recordedAt"`
}

func (h *HealthLogHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateHealthLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	v, err := h.uc.Update(c.Request.Context(), userID, c.Param("logId"), repository.UpdateHealthLogInput{
		ConditionLevel: req.ConditionLevel,
		Symptoms:       req.Symptoms,
		Notes:          req.Notes,
		RecordedAt:     parseDate(req.RecordedAt),
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

func (h *HealthLogHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("logId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
