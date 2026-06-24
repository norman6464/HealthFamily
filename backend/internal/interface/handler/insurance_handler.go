package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

type insuranceUC = usecase.MemberScopedCRUD[entity.Insurance, repository.CreateInsuranceInput, repository.UpdateInsuranceInput]

// InsuranceHandler は保険エンドポイント
type InsuranceHandler struct {
	uc *insuranceUC
}

func NewInsuranceHandler(uc *insuranceUC) *InsuranceHandler {
	return &InsuranceHandler{uc: uc}
}

func (h *InsuranceHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.List(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *InsuranceHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	v, err := h.uc.Get(c.Request.Context(), userID, c.Param("insuranceId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

type createInsuranceRequest struct {
	MemberID      string  `json:"memberId" binding:"required"`
	InsuranceType string  `json:"insuranceType" binding:"required"`
	ProviderName  *string `json:"providerName"`
	PolicyNumber  *string `json:"policyNumber"`
	Notes         *string `json:"notes"`
}

func (h *InsuranceHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createInsuranceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "メンバーIDと保険種別は必須です")
		return
	}
	v, err := h.uc.Create(c.Request.Context(), repository.CreateInsuranceInput{
		UserID:        userID,
		MemberID:      req.MemberID,
		InsuranceType: req.InsuranceType,
		ProviderName:  req.ProviderName,
		PolicyNumber:  req.PolicyNumber,
		Notes:         req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, v)
}

type updateInsuranceRequest struct {
	InsuranceType *string `json:"insuranceType"`
	ProviderName  *string `json:"providerName"`
	PolicyNumber  *string `json:"policyNumber"`
	Notes         *string `json:"notes"`
}

func (h *InsuranceHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateInsuranceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	v, err := h.uc.Update(c.Request.Context(), userID, c.Param("insuranceId"), repository.UpdateInsuranceInput{
		InsuranceType: req.InsuranceType,
		ProviderName:  req.ProviderName,
		PolicyNumber:  req.PolicyNumber,
		Notes:         req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

func (h *InsuranceHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("insuranceId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
