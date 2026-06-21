package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// TemperatureRecordHandler は体温記録エンドポイント
type TemperatureRecordHandler struct {
	uc *usecase.TemperatureRecordUsecase
}

func NewTemperatureRecordHandler(uc *usecase.TemperatureRecordUsecase) *TemperatureRecordHandler {
	return &TemperatureRecordHandler{uc: uc}
}

func (h *TemperatureRecordHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.List(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *TemperatureRecordHandler) ListByMember(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.ListByMember(c.Request.Context(), userID, c.Param("memberId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *TemperatureRecordHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	v, err := h.uc.Get(c.Request.Context(), userID, c.Param("recordId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

type createTemperatureRequest struct {
	MemberID    string   `json:"memberId" binding:"required"`
	Temperature *float64 `json:"temperature" binding:"required"`
	MeasuredAt  string   `json:"measuredAt" binding:"required"`
	Notes       *string  `json:"notes"`
}

func (h *TemperatureRecordHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createTemperatureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "メンバーID・体温・測定日時は必須です")
		return
	}
	date := parseDate(&req.MeasuredAt)
	if date == nil {
		response.Error(c, 400, "測定日時の形式が正しくありません")
		return
	}
	v, err := h.uc.Create(c.Request.Context(), repository.CreateTemperatureRecordInput{
		UserID:      userID,
		MemberID:    req.MemberID,
		Temperature: *req.Temperature,
		MeasuredAt:  *date,
		Notes:       req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, v)
}

type updateTemperatureRequest struct {
	Temperature *float64 `json:"temperature"`
	MeasuredAt  *string  `json:"measuredAt"`
	Notes       *string  `json:"notes"`
}

func (h *TemperatureRecordHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateTemperatureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	v, err := h.uc.Update(c.Request.Context(), userID, c.Param("recordId"), repository.UpdateTemperatureRecordInput{
		Temperature: req.Temperature,
		MeasuredAt:  parseDate(req.MeasuredAt),
		Notes:       req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

func (h *TemperatureRecordHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("recordId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
