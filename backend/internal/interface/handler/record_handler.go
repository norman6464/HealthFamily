package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// RecordHandler は服薬記録エンドポイント
type RecordHandler struct {
	uc *usecase.RecordUsecase
}

func NewRecordHandler(uc *usecase.RecordUsecase) *RecordHandler {
	return &RecordHandler{uc: uc}
}

func (h *RecordHandler) ListByUser(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.ListByUser(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *RecordHandler) ListByMember(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.ListByMember(c.Request.Context(), userID, c.Param("memberId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

type createRecordRequest struct {
	MemberID     string  `json:"memberId"`
	MedicationID string  `json:"medicationId" binding:"required"`
	ScheduleID   *string `json:"scheduleId"`
	Notes        *string `json:"notes"`
	DosageAmount *string `json:"dosageAmount"`
	TakenAt      *string `json:"takenAt"`
}

func (h *RecordHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "薬の指定は必須です")
		return
	}
	rec, err := h.uc.Create(c.Request.Context(), repository.CreateRecordInput{
		UserID:       userID,
		MedicationID: req.MedicationID,
		ScheduleID:   req.ScheduleID,
		Notes:        req.Notes,
		DosageAmount: req.DosageAmount,
		TakenAt:      parseDate(req.TakenAt),
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, rec)
}

func (h *RecordHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("recordId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
