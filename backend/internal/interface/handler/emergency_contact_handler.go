package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// EmergencyContactHandler は緊急連絡先エンドポイント
type EmergencyContactHandler struct {
	uc *usecase.EmergencyContactUsecase
}

func NewEmergencyContactHandler(uc *usecase.EmergencyContactUsecase) *EmergencyContactHandler {
	return &EmergencyContactHandler{uc: uc}
}

func (h *EmergencyContactHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.List(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *EmergencyContactHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	v, err := h.uc.Get(c.Request.Context(), userID, c.Param("contactId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

type createEmergencyContactRequest struct {
	MemberID     string  `json:"memberId" binding:"required"`
	ContactName  string  `json:"contactName" binding:"required"`
	PhoneNumber  string  `json:"phoneNumber" binding:"required"`
	Relationship *string `json:"relationship"`
	Notes        *string `json:"notes"`
}

func (h *EmergencyContactHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createEmergencyContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "メンバーID・連絡先名・電話番号は必須です")
		return
	}
	v, err := h.uc.Create(c.Request.Context(), repository.CreateEmergencyContactInput{
		UserID:       userID,
		MemberID:     req.MemberID,
		ContactName:  req.ContactName,
		PhoneNumber:  req.PhoneNumber,
		Relationship: req.Relationship,
		Notes:        req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, v)
}

type updateEmergencyContactRequest struct {
	ContactName  *string `json:"contactName"`
	PhoneNumber  *string `json:"phoneNumber"`
	Relationship *string `json:"relationship"`
	Notes        *string `json:"notes"`
}

func (h *EmergencyContactHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateEmergencyContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	v, err := h.uc.Update(c.Request.Context(), userID, c.Param("contactId"), repository.UpdateEmergencyContactInput{
		ContactName:  req.ContactName,
		PhoneNumber:  req.PhoneNumber,
		Relationship: req.Relationship,
		Notes:        req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

func (h *EmergencyContactHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("contactId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
