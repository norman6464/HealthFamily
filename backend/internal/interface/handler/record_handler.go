package handler

import (
	"strconv"
	"time"

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

	// 任意フィルタ: memberId / from / to / days / limit（未指定なら全件＝後方互換）
	f := repository.RecordFilter{MemberID: c.Query("memberId")}
	if from := c.Query("from"); from != "" {
		f.From = parseDate(&from)
	}
	if to := c.Query("to"); to != "" {
		f.To = parseDate(&to)
	}
	if days := c.Query("days"); days != "" {
		if d, err := strconv.Atoi(days); err == nil && d > 0 {
			t := time.Now().AddDate(0, 0, -d)
			f.From = &t
		}
	}
	if limit := c.Query("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 {
			f.Limit = l
		}
	}

	list, err := h.uc.ListFiltered(c.Request.Context(), userID, f)
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
