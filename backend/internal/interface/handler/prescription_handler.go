package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// PrescriptionHandler は処方箋エンドポイント
type PrescriptionHandler struct {
	uc *usecase.PrescriptionUsecase
}

func NewPrescriptionHandler(uc *usecase.PrescriptionUsecase) *PrescriptionHandler {
	return &PrescriptionHandler{uc: uc}
}

func (h *PrescriptionHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.List(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *PrescriptionHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	v, err := h.uc.Get(c.Request.Context(), userID, c.Param("prescriptionId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

type createPrescriptionRequest struct {
	MemberID     string  `json:"memberId" binding:"required"`
	Name         string  `json:"name" binding:"required"`
	ImageData    *string `json:"imageData"`
	Notes        *string `json:"notes"`
	PrescribedAt *string `json:"prescribedAt"`
}

func (h *PrescriptionHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createPrescriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "メンバーIDと名称は必須です")
		return
	}
	v, err := h.uc.Create(c.Request.Context(), repository.CreatePrescriptionInput{
		UserID:       userID,
		MemberID:     req.MemberID,
		Name:         req.Name,
		ImageData:    req.ImageData,
		Notes:        req.Notes,
		PrescribedAt: parseDate(req.PrescribedAt),
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, v)
}

type updatePrescriptionRequest struct {
	Name         *string `json:"name"`
	ImageData    *string `json:"imageData"`
	Notes        *string `json:"notes"`
	PrescribedAt *string `json:"prescribedAt"`
}

func (h *PrescriptionHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updatePrescriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	v, err := h.uc.Update(c.Request.Context(), userID, c.Param("prescriptionId"), repository.UpdatePrescriptionInput{
		Name:         req.Name,
		ImageData:    req.ImageData,
		Notes:        req.Notes,
		PrescribedAt: parseDate(req.PrescribedAt),
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

func (h *PrescriptionHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("prescriptionId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
