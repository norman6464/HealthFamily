package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// HospitalHandler は病院エンドポイント
type HospitalHandler struct {
	uc *usecase.HospitalUsecase
}

func NewHospitalHandler(uc *usecase.HospitalUsecase) *HospitalHandler {
	return &HospitalHandler{uc: uc}
}

func (h *HospitalHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.List(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *HospitalHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	v, err := h.uc.Get(c.Request.Context(), userID, c.Param("hospitalId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

type createHospitalRequest struct {
	Name         string  `json:"name" binding:"required,max=200"`
	HospitalType *string `json:"hospitalType"`
	Address      *string `json:"address"`
	PhoneNumber  *string `json:"phoneNumber"`
	Department   *string `json:"department"`
	DoctorName   *string `json:"doctorName"`
	Notes        *string `json:"notes"`
}

func (h *HospitalHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createHospitalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "病院名は必須です")
		return
	}
	v, err := h.uc.Create(c.Request.Context(), repository.CreateHospitalInput{
		UserID:       userID,
		Name:         req.Name,
		HospitalType: req.HospitalType,
		Address:      req.Address,
		PhoneNumber:  req.PhoneNumber,
		Department:   req.Department,
		DoctorName:   req.DoctorName,
		Notes:        req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, v)
}

type updateHospitalRequest struct {
	Name         *string `json:"name"`
	HospitalType *string `json:"hospitalType"`
	Address      *string `json:"address"`
	PhoneNumber  *string `json:"phoneNumber"`
	Department   *string `json:"department"`
	DoctorName   *string `json:"doctorName"`
	Notes        *string `json:"notes"`
}

func (h *HospitalHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateHospitalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	v, err := h.uc.Update(c.Request.Context(), userID, c.Param("hospitalId"), repository.UpdateHospitalInput{
		Name:         req.Name,
		HospitalType: req.HospitalType,
		Address:      req.Address,
		PhoneNumber:  req.PhoneNumber,
		Department:   req.Department,
		DoctorName:   req.DoctorName,
		Notes:        req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

func (h *HospitalHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("hospitalId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
