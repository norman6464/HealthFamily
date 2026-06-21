package handler

import (
	"time"

	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// ScheduleHandler はスケジュールエンドポイント
type ScheduleHandler struct {
	uc *usecase.ScheduleUsecase
}

func NewScheduleHandler(uc *usecase.ScheduleUsecase) *ScheduleHandler {
	return &ScheduleHandler{uc: uc}
}

func (h *ScheduleHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.List(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *ScheduleHandler) Today(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.Today(c.Request.Context(), userID, time.Now())
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

type createScheduleRequest struct {
	MedicationID          string   `json:"medicationId" binding:"required"`
	ScheduledTime         string   `json:"scheduledTime" binding:"required"`
	DaysOfWeek            []string `json:"daysOfWeek"`
	IntervalDays          *int     `json:"intervalDays"`
	StartDate             *string  `json:"startDate"`
	IsEnabled             *bool    `json:"isEnabled"`
	ReminderMinutesBefore *int     `json:"reminderMinutesBefore"`
}

func (h *ScheduleHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "予定時刻と薬の指定は必須です")
		return
	}
	isEnabled := true
	if req.IsEnabled != nil {
		isEnabled = *req.IsEnabled
	}
	reminder := 5
	if req.ReminderMinutesBefore != nil {
		reminder = *req.ReminderMinutesBefore
	}
	s, err := h.uc.Create(c.Request.Context(), repository.CreateScheduleInput{
		MedicationID:          req.MedicationID,
		UserID:                userID,
		ScheduledTime:         req.ScheduledTime,
		DaysOfWeek:            req.DaysOfWeek,
		IntervalDays:          req.IntervalDays,
		StartDate:             parseDate(req.StartDate),
		IsEnabled:             isEnabled,
		ReminderMinutesBefore: reminder,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, s)
}

type updateScheduleRequest struct {
	ScheduledTime         *string  `json:"scheduledTime"`
	DaysOfWeek            []string `json:"daysOfWeek"`
	IntervalDays          *int     `json:"intervalDays"`
	StartDate             *string  `json:"startDate"`
	IsEnabled             *bool    `json:"isEnabled"`
	ReminderMinutesBefore *int     `json:"reminderMinutesBefore"`
}

func (h *ScheduleHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	s, err := h.uc.Update(c.Request.Context(), userID, c.Param("scheduleId"), repository.UpdateScheduleInput{
		ScheduledTime:         req.ScheduledTime,
		DaysOfWeek:            req.DaysOfWeek,
		IntervalDays:          req.IntervalDays,
		StartDate:             parseDate(req.StartDate),
		IsEnabled:             req.IsEnabled,
		ReminderMinutesBefore: req.ReminderMinutesBefore,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, s)
}

func (h *ScheduleHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("scheduleId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
