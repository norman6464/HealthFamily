package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

type appointmentUC = usecase.MemberScopedCRUD[entity.Appointment, repository.CreateAppointmentInput, repository.UpdateAppointmentInput]

// AppointmentHandler は通院予定エンドポイント
type AppointmentHandler struct {
	uc *appointmentUC
}

func NewAppointmentHandler(uc *appointmentUC) *AppointmentHandler {
	return &AppointmentHandler{uc: uc}
}

func (h *AppointmentHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.List(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *AppointmentHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	v, err := h.uc.Get(c.Request.Context(), userID, c.Param("appointmentId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

type createAppointmentRequest struct {
	MemberID           string   `json:"memberId" binding:"required"`
	HospitalID         *string  `json:"hospitalId"`
	AppointmentType    *string  `json:"appointmentType"`
	AppointmentDate    string   `json:"appointmentDate" binding:"required"`
	Description        *string  `json:"description"`
	TestResults        *string  `json:"testResults"`
	Cost               *float64 `json:"cost"`
	ReminderEnabled    *bool    `json:"reminderEnabled"`
	ReminderDaysBefore *int     `json:"reminderDaysBefore"`
}

func (h *AppointmentHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "メンバーIDと予定日時は必須です")
		return
	}
	date := parseDate(&req.AppointmentDate)
	if date == nil {
		response.Error(c, 400, "予定日時の形式が正しくありません")
		return
	}
	v, err := h.uc.Create(c.Request.Context(), repository.CreateAppointmentInput{
		UserID:             userID,
		MemberID:           req.MemberID,
		HospitalID:         req.HospitalID,
		AppointmentType:    req.AppointmentType,
		AppointmentDate:    *date,
		Description:        req.Description,
		TestResults:        req.TestResults,
		Cost:               req.Cost,
		ReminderEnabled:    req.ReminderEnabled,
		ReminderDaysBefore: req.ReminderDaysBefore,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, v)
}

type updateAppointmentRequest struct {
	HospitalID         *string  `json:"hospitalId"`
	AppointmentType    *string  `json:"appointmentType"`
	AppointmentDate    *string  `json:"appointmentDate"`
	Description        *string  `json:"description"`
	TestResults        *string  `json:"testResults"`
	Cost               *float64 `json:"cost"`
	ReminderEnabled    *bool    `json:"reminderEnabled"`
	ReminderDaysBefore *int     `json:"reminderDaysBefore"`
}

func (h *AppointmentHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	v, err := h.uc.Update(c.Request.Context(), userID, c.Param("appointmentId"), repository.UpdateAppointmentInput{
		HospitalID:         req.HospitalID,
		AppointmentType:    req.AppointmentType,
		AppointmentDate:    parseDate(req.AppointmentDate),
		Description:        req.Description,
		TestResults:        req.TestResults,
		Cost:               req.Cost,
		ReminderEnabled:    req.ReminderEnabled,
		ReminderDaysBefore: req.ReminderDaysBefore,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, v)
}

func (h *AppointmentHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("appointmentId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
