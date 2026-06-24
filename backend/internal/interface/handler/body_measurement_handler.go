package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

type bodyMeasurementUC = usecase.MemberScopedCRUD[entity.BodyMeasurement, repository.CreateBodyMeasurementInput, repository.UpdateBodyMeasurementInput]

// BodyMeasurementHandler は身体測定エンドポイント
type BodyMeasurementHandler struct {
	uc *bodyMeasurementUC
}

func NewBodyMeasurementHandler(uc *bodyMeasurementUC) *BodyMeasurementHandler {
	return &BodyMeasurementHandler{uc: uc}
}

func (h *BodyMeasurementHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.List(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *BodyMeasurementHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	v, err := h.uc.Get(c.Request.Context(), userID, c.Param("measurementId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

type createBodyMeasurementRequest struct {
	MemberID   string   `json:"memberId" binding:"required"`
	Weight     *float64 `json:"weight"`
	Height     *float64 `json:"height"`
	RecordedAt string   `json:"recordedAt" binding:"required"`
	Notes      *string  `json:"notes"`
}

func (h *BodyMeasurementHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createBodyMeasurementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "メンバーIDと記録日時は必須です")
		return
	}
	date := parseDate(&req.RecordedAt)
	if date == nil {
		response.Error(c, 400, "記録日時の形式が正しくありません")
		return
	}
	v, err := h.uc.Create(c.Request.Context(), repository.CreateBodyMeasurementInput{
		UserID:     userID,
		MemberID:   req.MemberID,
		Weight:     req.Weight,
		Height:     req.Height,
		RecordedAt: *date,
		Notes:      req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, v)
}

type updateBodyMeasurementRequest struct {
	Weight     *float64 `json:"weight"`
	Height     *float64 `json:"height"`
	RecordedAt *string  `json:"recordedAt"`
	Notes      *string  `json:"notes"`
}

func (h *BodyMeasurementHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateBodyMeasurementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	v, err := h.uc.Update(c.Request.Context(), userID, c.Param("measurementId"), repository.UpdateBodyMeasurementInput{
		Weight:     req.Weight,
		Height:     req.Height,
		RecordedAt: parseDate(req.RecordedAt),
		Notes:      req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

func (h *BodyMeasurementHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("measurementId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
