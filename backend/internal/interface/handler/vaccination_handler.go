package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

type vaccinationUC = usecase.MemberScopedCRUD[entity.Vaccination, repository.CreateVaccinationInput, repository.UpdateVaccinationInput]

// VaccinationHandler は予防接種エンドポイント
type VaccinationHandler struct {
	uc *vaccinationUC
}

func NewVaccinationHandler(uc *vaccinationUC) *VaccinationHandler {
	return &VaccinationHandler{uc: uc}
}

func (h *VaccinationHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.List(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *VaccinationHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	v, err := h.uc.Get(c.Request.Context(), userID, c.Param("vaccinationId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

type createVaccinationRequest struct {
	MemberID          string  `json:"memberId" binding:"required"`
	VaccineName       string  `json:"vaccineName" binding:"required"`
	VaccinatedAt      string  `json:"vaccinatedAt" binding:"required"`
	NextScheduledDate *string `json:"nextScheduledDate"`
	Notes             *string `json:"notes"`
}

func (h *VaccinationHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createVaccinationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "メンバーID・ワクチン名・接種日は必須です")
		return
	}
	date := parseDate(&req.VaccinatedAt)
	if date == nil {
		response.Error(c, 400, "接種日の形式が正しくありません")
		return
	}
	v, err := h.uc.Create(c.Request.Context(), repository.CreateVaccinationInput{
		UserID:            userID,
		MemberID:          req.MemberID,
		VaccineName:       req.VaccineName,
		VaccinatedAt:      *date,
		NextScheduledDate: parseDate(req.NextScheduledDate),
		Notes:             req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, v)
}

type updateVaccinationRequest struct {
	VaccineName       *string `json:"vaccineName"`
	VaccinatedAt      *string `json:"vaccinatedAt"`
	NextScheduledDate *string `json:"nextScheduledDate"`
	Notes             *string `json:"notes"`
}

func (h *VaccinationHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateVaccinationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	v, err := h.uc.Update(c.Request.Context(), userID, c.Param("vaccinationId"), repository.UpdateVaccinationInput{
		VaccineName:       req.VaccineName,
		VaccinatedAt:      parseDate(req.VaccinatedAt),
		NextScheduledDate: parseDate(req.NextScheduledDate),
		Notes:             req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

func (h *VaccinationHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("vaccinationId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
