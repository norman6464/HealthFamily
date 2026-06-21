package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// ExaminationHandler は検査エンドポイント
type ExaminationHandler struct {
	uc *usecase.ExaminationUsecase
}

func NewExaminationHandler(uc *usecase.ExaminationUsecase) *ExaminationHandler {
	return &ExaminationHandler{uc: uc}
}

func (h *ExaminationHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.List(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *ExaminationHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	v, err := h.uc.Get(c.Request.Context(), userID, c.Param("examinationId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

type createExaminationRequest struct {
	MemberID          string  `json:"memberId" binding:"required"`
	ExaminationType   string  `json:"examinationType" binding:"required"`
	ExaminedAt        string  `json:"examinedAt" binding:"required"`
	NextScheduledDate *string `json:"nextScheduledDate"`
	Notes             *string `json:"notes"`
	ImageData         *string `json:"imageData"`
}

func (h *ExaminationHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createExaminationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "メンバーID・検査種別・検査日は必須です")
		return
	}
	date := parseDate(&req.ExaminedAt)
	if date == nil {
		response.Error(c, 400, "検査日の形式が正しくありません")
		return
	}
	v, err := h.uc.Create(c.Request.Context(), repository.CreateExaminationInput{
		UserID:            userID,
		MemberID:          req.MemberID,
		ExaminationType:   req.ExaminationType,
		ExaminedAt:        *date,
		NextScheduledDate: parseDate(req.NextScheduledDate),
		Notes:             req.Notes,
		ImageData:         req.ImageData,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, v)
}

type updateExaminationRequest struct {
	ExaminationType   *string `json:"examinationType"`
	ExaminedAt        *string `json:"examinedAt"`
	NextScheduledDate *string `json:"nextScheduledDate"`
	Notes             *string `json:"notes"`
	ImageData         *string `json:"imageData"`
}

func (h *ExaminationHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateExaminationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	v, err := h.uc.Update(c.Request.Context(), userID, c.Param("examinationId"), repository.UpdateExaminationInput{
		ExaminationType:   req.ExaminationType,
		ExaminedAt:        parseDate(req.ExaminedAt),
		NextScheduledDate: parseDate(req.NextScheduledDate),
		Notes:             req.Notes,
		ImageData:         req.ImageData,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

func (h *ExaminationHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("examinationId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
