package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// MedicationHandler は薬エンドポイント
type MedicationHandler struct {
	uc *usecase.MedicationUsecase
}

func NewMedicationHandler(uc *usecase.MedicationUsecase) *MedicationHandler {
	return &MedicationHandler{uc: uc}
}

func (h *MedicationHandler) ListByUser(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.ListByUser(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *MedicationHandler) Alerts(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.ListAlerts(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *MedicationHandler) ListByMember(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.ListByMember(c.Request.Context(), userID, c.Param("memberId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *MedicationHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	m, err := h.uc.Get(c.Request.Context(), userID, c.Param("medicationId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, m)
}

type createMedicationRequest struct {
	MemberID       string  `json:"memberId" binding:"required"`
	Name           string  `json:"name" binding:"required,max=200"`
	Category       string  `json:"category"`
	DosageAmount   *string `json:"dosageAmount"`
	Frequency      *string `json:"frequency"`
	StockQuantity  *int    `json:"stockQuantity"`
	StockAlertDate *string `json:"stockAlertDate"`
	Instructions   *string `json:"instructions"`
}

func (h *MedicationHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createMedicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "薬の名前とメンバーIDは必須です")
		return
	}
	m, err := h.uc.Create(c.Request.Context(), repository.CreateMedicationInput{
		UserID:         userID,
		MemberID:       req.MemberID,
		Name:           req.Name,
		Category:       req.Category,
		DosageAmount:   req.DosageAmount,
		Frequency:      req.Frequency,
		StockQuantity:  req.StockQuantity,
		StockAlertDate: parseDate(req.StockAlertDate),
		Instructions:   req.Instructions,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, m)
}

type updateMedicationRequest struct {
	Name           *string `json:"name"`
	Category       *string `json:"category"`
	DosageAmount   *string `json:"dosageAmount"`
	Frequency      *string `json:"frequency"`
	StockQuantity  *int    `json:"stockQuantity"`
	StockAlertDate *string `json:"stockAlertDate"`
	Instructions   *string `json:"instructions"`
	IsActive       *bool   `json:"isActive"`
	Status         *string `json:"status"`
}

func (h *MedicationHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateMedicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	m, err := h.uc.Update(c.Request.Context(), userID, c.Param("medicationId"), repository.UpdateMedicationInput{
		Name:           req.Name,
		Category:       req.Category,
		DosageAmount:   req.DosageAmount,
		Frequency:      req.Frequency,
		StockQuantity:  req.StockQuantity,
		StockAlertDate: parseDate(req.StockAlertDate),
		Instructions:   req.Instructions,
		IsActive:       req.IsActive,
		Status:         req.Status,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, m)
}

type updateStockRequest struct {
	StockQuantity int `json:"stockQuantity"`
}

func (h *MedicationHandler) UpdateStock(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "在庫数は0以上の数値を指定してください")
		return
	}
	m, err := h.uc.UpdateStock(c.Request.Context(), userID, c.Param("medicationId"), req.StockQuantity)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, m)
}

type reorderRequest struct {
	OrderedIDs []string `json:"orderedIds" binding:"required"`
}

func (h *MedicationHandler) Reorder(c *gin.Context) {
	userID := middleware.UserID(c)
	var req reorderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "並び順の指定が正しくありません")
		return
	}
	if err := h.uc.Reorder(c.Request.Context(), userID, req.OrderedIDs); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}

func (h *MedicationHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("medicationId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
