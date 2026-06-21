package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// AllergyHandler はアレルギーエンドポイント
type AllergyHandler struct {
	uc *usecase.AllergyUsecase
}

func NewAllergyHandler(uc *usecase.AllergyUsecase) *AllergyHandler {
	return &AllergyHandler{uc: uc}
}

func (h *AllergyHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.List(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *AllergyHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	v, err := h.uc.Get(c.Request.Context(), userID, c.Param("allergyId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

type createAllergyRequest struct {
	MemberID     string  `json:"memberId" binding:"required"`
	AllergenName string  `json:"allergenName" binding:"required"`
	AllergyType  string  `json:"allergyType" binding:"required"`
	Severity     string  `json:"severity" binding:"required"`
	Symptoms     *string `json:"symptoms"`
	DiagnosedAt  *string `json:"diagnosedAt"`
	Notes        *string `json:"notes"`
}

func (h *AllergyHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createAllergyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "メンバーID・アレルゲン名・種別・重症度は必須です")
		return
	}
	v, err := h.uc.Create(c.Request.Context(), repository.CreateAllergyInput{
		UserID:       userID,
		MemberID:     req.MemberID,
		AllergenName: req.AllergenName,
		AllergyType:  req.AllergyType,
		Severity:     req.Severity,
		Symptoms:     req.Symptoms,
		DiagnosedAt:  parseDate(req.DiagnosedAt),
		Notes:        req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, v)
}

type updateAllergyRequest struct {
	AllergenName *string `json:"allergenName"`
	AllergyType  *string `json:"allergyType"`
	Severity     *string `json:"severity"`
	Symptoms     *string `json:"symptoms"`
	DiagnosedAt  *string `json:"diagnosedAt"`
	Notes        *string `json:"notes"`
}

func (h *AllergyHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateAllergyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	v, err := h.uc.Update(c.Request.Context(), userID, c.Param("allergyId"), repository.UpdateAllergyInput{
		AllergenName: req.AllergenName,
		AllergyType:  req.AllergyType,
		Severity:     req.Severity,
		Symptoms:     req.Symptoms,
		DiagnosedAt:  parseDate(req.DiagnosedAt),
		Notes:        req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

func (h *AllergyHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("allergyId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
