package repository

import (
	"context"
	"time"

	"healthfamily/internal/domain/entity"
)

// ---- Hospital ----

type CreateHospitalInput struct {
	UserID       string
	Name         string
	HospitalType *string
	Address      *string
	PhoneNumber  *string
	Department   *string
	DoctorName   *string
	Notes        *string
}

type UpdateHospitalInput struct {
	Name         *string
	HospitalType *string
	Address      *string
	PhoneNumber  *string
	Department   *string
	DoctorName   *string
	Notes        *string
}

type HospitalRepository interface {
	List(ctx context.Context, userID string) ([]entity.Hospital, error)
	FindByID(ctx context.Context, id string) (*entity.Hospital, error)
	Create(ctx context.Context, in CreateHospitalInput) (*entity.Hospital, error)
	Update(ctx context.Context, id string, in UpdateHospitalInput) (*entity.Hospital, error)
	Delete(ctx context.Context, id string) error
}

// ---- Appointment ----

type CreateAppointmentInput struct {
	UserID             string
	MemberID           string
	HospitalID         *string
	AppointmentType    *string
	AppointmentDate    time.Time
	Description        *string
	TestResults        *string
	Cost               *float64
	ReminderEnabled    *bool
	ReminderDaysBefore *int
}

type UpdateAppointmentInput struct {
	HospitalID         *string
	AppointmentType    *string
	AppointmentDate    *time.Time
	Description        *string
	TestResults        *string
	Cost               *float64
	ReminderEnabled    *bool
	ReminderDaysBefore *int
}

type AppointmentRepository interface {
	List(ctx context.Context, userID string) ([]entity.Appointment, error)
	FindByID(ctx context.Context, id string) (*entity.Appointment, error)
	Create(ctx context.Context, in CreateAppointmentInput) (*entity.Appointment, error)
	Update(ctx context.Context, id string, in UpdateAppointmentInput) (*entity.Appointment, error)
	Delete(ctx context.Context, id string) error
}

// ---- HealthLog ----

type CreateHealthLogInput struct {
	UserID         string
	MemberID       string
	ConditionLevel int
	Symptoms       []string
	Notes          *string
	RecordedAt     *time.Time
}

type UpdateHealthLogInput struct {
	ConditionLevel *int
	Symptoms       []string
	Notes          *string
	RecordedAt     *time.Time
}

type HealthLogRepository interface {
	List(ctx context.Context, userID string) ([]entity.HealthLog, error)
	FindByID(ctx context.Context, id string) (*entity.HealthLog, error)
	Create(ctx context.Context, in CreateHealthLogInput) (*entity.HealthLog, error)
	Update(ctx context.Context, id string, in UpdateHealthLogInput) (*entity.HealthLog, error)
	Delete(ctx context.Context, id string) error
}

// ---- Vaccination ----

type CreateVaccinationInput struct {
	UserID            string
	MemberID          string
	VaccineName       string
	VaccinatedAt      time.Time
	NextScheduledDate *time.Time
	Notes             *string
}

type UpdateVaccinationInput struct {
	VaccineName       *string
	VaccinatedAt      *time.Time
	NextScheduledDate *time.Time
	Notes             *string
}

type VaccinationRepository interface {
	List(ctx context.Context, userID string) ([]entity.Vaccination, error)
	FindByID(ctx context.Context, id string) (*entity.Vaccination, error)
	Create(ctx context.Context, in CreateVaccinationInput) (*entity.Vaccination, error)
	Update(ctx context.Context, id string, in UpdateVaccinationInput) (*entity.Vaccination, error)
	Delete(ctx context.Context, id string) error
}

// ---- Examination ----

type CreateExaminationInput struct {
	UserID            string
	MemberID          string
	ExaminationType   string
	ExaminedAt        time.Time
	NextScheduledDate *time.Time
	Notes             *string
	ImageData         *string
}

type UpdateExaminationInput struct {
	ExaminationType   *string
	ExaminedAt        *time.Time
	NextScheduledDate *time.Time
	Notes             *string
	ImageData         *string
}

type ExaminationRepository interface {
	List(ctx context.Context, userID string) ([]entity.Examination, error)
	FindByID(ctx context.Context, id string) (*entity.Examination, error)
	Create(ctx context.Context, in CreateExaminationInput) (*entity.Examination, error)
	Update(ctx context.Context, id string, in UpdateExaminationInput) (*entity.Examination, error)
	Delete(ctx context.Context, id string) error
}

// ---- Insurance ----

type CreateInsuranceInput struct {
	UserID        string
	MemberID      string
	InsuranceType string
	ProviderName  *string
	PolicyNumber  *string
	Notes         *string
}

type UpdateInsuranceInput struct {
	InsuranceType *string
	ProviderName  *string
	PolicyNumber  *string
	Notes         *string
}

type InsuranceRepository interface {
	List(ctx context.Context, userID string) ([]entity.Insurance, error)
	FindByID(ctx context.Context, id string) (*entity.Insurance, error)
	Create(ctx context.Context, in CreateInsuranceInput) (*entity.Insurance, error)
	Update(ctx context.Context, id string, in UpdateInsuranceInput) (*entity.Insurance, error)
	Delete(ctx context.Context, id string) error
}

// ---- Allergy ----

type CreateAllergyInput struct {
	UserID       string
	MemberID     string
	AllergenName string
	AllergyType  string
	Severity     string
	Symptoms     *string
	DiagnosedAt  *time.Time
	Notes        *string
}

type UpdateAllergyInput struct {
	AllergenName *string
	AllergyType  *string
	Severity     *string
	Symptoms     *string
	DiagnosedAt  *time.Time
	Notes        *string
}

type AllergyRepository interface {
	List(ctx context.Context, userID string) ([]entity.Allergy, error)
	FindByID(ctx context.Context, id string) (*entity.Allergy, error)
	Create(ctx context.Context, in CreateAllergyInput) (*entity.Allergy, error)
	Update(ctx context.Context, id string, in UpdateAllergyInput) (*entity.Allergy, error)
	Delete(ctx context.Context, id string) error
}

// ---- BodyMeasurement ----

type CreateBodyMeasurementInput struct {
	UserID     string
	MemberID   string
	Weight     *float64
	Height     *float64
	RecordedAt time.Time
	Notes      *string
}

type UpdateBodyMeasurementInput struct {
	Weight     *float64
	Height     *float64
	RecordedAt *time.Time
	Notes      *string
}

type BodyMeasurementRepository interface {
	List(ctx context.Context, userID string) ([]entity.BodyMeasurement, error)
	FindByID(ctx context.Context, id string) (*entity.BodyMeasurement, error)
	Create(ctx context.Context, in CreateBodyMeasurementInput) (*entity.BodyMeasurement, error)
	Update(ctx context.Context, id string, in UpdateBodyMeasurementInput) (*entity.BodyMeasurement, error)
	Delete(ctx context.Context, id string) error
}

// ---- TemperatureRecord ----

type CreateTemperatureRecordInput struct {
	UserID      string
	MemberID    string
	Temperature float64
	MeasuredAt  time.Time
	Notes       *string
}

type UpdateTemperatureRecordInput struct {
	Temperature *float64
	MeasuredAt  *time.Time
	Notes       *string
}

type TemperatureRecordRepository interface {
	List(ctx context.Context, userID string) ([]entity.TemperatureRecord, error)
	ListByMember(ctx context.Context, memberID string) ([]entity.TemperatureRecord, error)
	FindByID(ctx context.Context, id string) (*entity.TemperatureRecord, error)
	Create(ctx context.Context, in CreateTemperatureRecordInput) (*entity.TemperatureRecord, error)
	Update(ctx context.Context, id string, in UpdateTemperatureRecordInput) (*entity.TemperatureRecord, error)
	Delete(ctx context.Context, id string) error
}

// ---- EmergencyContact ----

type CreateEmergencyContactInput struct {
	UserID       string
	MemberID     string
	ContactName  string
	PhoneNumber  string
	Relationship *string
	Notes        *string
}

type UpdateEmergencyContactInput struct {
	ContactName  *string
	PhoneNumber  *string
	Relationship *string
	Notes        *string
}

type EmergencyContactRepository interface {
	List(ctx context.Context, userID string) ([]entity.EmergencyContact, error)
	FindByID(ctx context.Context, id string) (*entity.EmergencyContact, error)
	Create(ctx context.Context, in CreateEmergencyContactInput) (*entity.EmergencyContact, error)
	Update(ctx context.Context, id string, in UpdateEmergencyContactInput) (*entity.EmergencyContact, error)
	Delete(ctx context.Context, id string) error
}

// ---- Prescription ----

type CreatePrescriptionInput struct {
	UserID           string
	MemberID         string
	PrescriptionName string
	PrescribedBy     *string
	PrescribedAt     time.Time
	ExpiresAt        *time.Time
	PharmacyName     *string
	Notes            *string
}

type UpdatePrescriptionInput struct {
	PrescriptionName *string
	PrescribedBy     *string
	PrescribedAt     *time.Time
	ExpiresAt        *time.Time
	PharmacyName     *string
	Notes            *string
}

type PrescriptionRepository interface {
	List(ctx context.Context, userID string) ([]entity.Prescription, error)
	FindByID(ctx context.Context, id string) (*entity.Prescription, error)
	Create(ctx context.Context, in CreatePrescriptionInput) (*entity.Prescription, error)
	Update(ctx context.Context, id string, in UpdatePrescriptionInput) (*entity.Prescription, error)
	Delete(ctx context.Context, id string) error
}

// ---- NotificationSetting ----

type UpsertNotificationSettingInput struct {
	UserID                               string
	MedicationReminderEnabled            *bool
	MissedMedicationEnabled              *bool
	AppointmentReminderEnabled           *bool
	LowStockAlertEnabled                 *bool
	DefaultReminderMinutesBefore         *int
	DefaultAppointmentReminderDaysBefore *int
	EmailNotificationEnabled             *bool
}

type NotificationSettingRepository interface {
	FindByUserID(ctx context.Context, userID string) (*entity.NotificationSetting, error)
	Upsert(ctx context.Context, in UpsertNotificationSettingInput) (*entity.NotificationSetting, error)
}
