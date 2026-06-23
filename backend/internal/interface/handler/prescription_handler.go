package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/entity"
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
	MemberID         string  `json:"memberId" binding:"required"`
	PrescriptionName string  `json:"prescriptionName" binding:"required"`
	PrescribedBy     *string `json:"prescribedBy"`
	PrescribedAt     *string `json:"prescribedAt" binding:"required"`
	ExpiresAt        *string `json:"expiresAt"`
	PharmacyName     *string `json:"pharmacyName"`
	ElectronicCode   *string `json:"electronicCode"`
	Notes            *string `json:"notes"`
}

func (h *PrescriptionHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createPrescriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "メンバーID・名称・処方日は必須です")
		return
	}
	prescribedAt := parseDate(req.PrescribedAt)
	if prescribedAt == nil {
		response.Error(c, 400, "処方日の形式が正しくありません")
		return
	}
	v, err := h.uc.Create(c.Request.Context(), repository.CreatePrescriptionInput{
		UserID:           userID,
		MemberID:         req.MemberID,
		PrescriptionName: req.PrescriptionName,
		PrescribedBy:     req.PrescribedBy,
		PrescribedAt:     *prescribedAt,
		ExpiresAt:        parseDate(req.ExpiresAt),
		PharmacyName:     req.PharmacyName,
		ElectronicCode:   req.ElectronicCode,
		Notes:            req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, v)
}

type updatePrescriptionRequest struct {
	PrescriptionName *string `json:"prescriptionName"`
	PrescribedBy     *string `json:"prescribedBy"`
	PrescribedAt     *string `json:"prescribedAt"`
	ExpiresAt        *string `json:"expiresAt"`
	PharmacyName     *string `json:"pharmacyName"`
	ElectronicCode   *string `json:"electronicCode"`
	Notes            *string `json:"notes"`
}

func (h *PrescriptionHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updatePrescriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	v, err := h.uc.Update(c.Request.Context(), userID, c.Param("prescriptionId"), repository.UpdatePrescriptionInput{
		PrescriptionName: req.PrescriptionName,
		PrescribedBy:     req.PrescribedBy,
		PrescribedAt:     parseDate(req.PrescribedAt),
		ExpiresAt:        parseDate(req.ExpiresAt),
		PharmacyName:     req.PharmacyName,
		ElectronicCode:   req.ElectronicCode,
		Notes:            req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

type prescriptionItemReq struct {
	Name      string  `json:"name"`
	Dosage    *string `json:"dosage"`
	Frequency *string `json:"frequency"`
	Days      *int    `json:"days"`
}

type setItemsRequest struct {
	Items []prescriptionItemReq `json:"items"`
}

// SetItems は処方明細を置き換える。
func (h *PrescriptionHandler) SetItems(c *gin.Context) {
	userID := middleware.UserID(c)
	var req setItemsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "明細の内容が正しくありません")
		return
	}
	items := make([]entity.PrescriptionItem, 0, len(req.Items))
	for _, it := range req.Items {
		items = append(items, entity.PrescriptionItem{
			Name: it.Name, Dosage: it.Dosage, Frequency: it.Frequency, Days: it.Days,
		})
	}
	p, err := h.uc.SetItems(c.Request.Context(), userID, c.Param("prescriptionId"), items)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, p)
}

// Dispense は処方明細から服薬管理を一括作成する。
func (h *PrescriptionHandler) Dispense(c *gin.Context) {
	userID := middleware.UserID(c)
	meds, err := h.uc.Dispense(c.Request.Context(), userID, c.Param("prescriptionId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, meds)
}

func (h *PrescriptionHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("prescriptionId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
