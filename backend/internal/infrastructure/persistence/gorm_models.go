package persistence

import (
	"time"

	"github.com/lib/pq"
)

// intPtr は sqlc が生成する *int32 を entity の *int へ変換する。
func intPtr(p *int32) *int {
	if p == nil {
		return nil
	}
	v := int(*p)
	return &v
}

// GORM 用モデル。書き込み系(Create/Update/Delete)で利用する。
// 既存スキーマ(PascalCaseテーブル・camelCase列)に合わせて column タグを明示する。
// createdAt は DB 既定値(now())を使うため default タグを付け、ゼロ値時は INSERT から除外させる。

type gormExpense struct {
	ID           string    `gorm:"column:id;primaryKey"`
	UserID       string    `gorm:"column:userId"`
	MemberID     *string   `gorm:"column:memberId"`
	Category     string    `gorm:"column:category"`
	Amount       int       `gorm:"column:amount"`
	Description  *string   `gorm:"column:description"`
	ExpenseDate  time.Time `gorm:"column:expenseDate"`
	IsDeductible bool      `gorm:"column:isDeductible"`
	CreatedAt    time.Time `gorm:"column:createdAt;default:now()"`
}

func (gormExpense) TableName() string { return "Expense" }

type gormBudget struct {
	ID               string    `gorm:"column:id;primaryKey"`
	UserID           string    `gorm:"column:userId"`
	MonthlyAmount    int       `gorm:"column:monthlyAmount"`
	AlertEnabled     bool      `gorm:"column:alertEnabled"`
	LastAlertedMonth *string   `gorm:"column:lastAlertedMonth"`
	CreatedAt        time.Time `gorm:"column:createdAt;default:now()"`
	UpdatedAt        time.Time `gorm:"column:updatedAt;default:now()"`
}

func (gormBudget) TableName() string { return "Budget" }

type gormCategoryBudget struct {
	ID            string    `gorm:"column:id;primaryKey"`
	UserID        string    `gorm:"column:userId"`
	Category      string    `gorm:"column:category"`
	MonthlyAmount int       `gorm:"column:monthlyAmount"`
	CreatedAt     time.Time `gorm:"column:createdAt;default:now()"`
	UpdatedAt     time.Time `gorm:"column:updatedAt;default:now()"`
}

func (gormCategoryBudget) TableName() string { return "CategoryBudget" }

type gormPrescription struct {
	ID               string     `gorm:"column:id;primaryKey"`
	UserID           string     `gorm:"column:userId"`
	MemberID         string     `gorm:"column:memberId"`
	PrescriptionName string     `gorm:"column:prescriptionName"`
	PrescribedBy     *string    `gorm:"column:prescribedBy"`
	PrescribedAt     time.Time  `gorm:"column:prescribedAt"`
	ExpiresAt        *time.Time `gorm:"column:expiresAt"`
	PharmacyName     *string    `gorm:"column:pharmacyName"`
	ElectronicCode   *string    `gorm:"column:electronicCode"`
	Notes            *string    `gorm:"column:notes"`
	CreatedAt        time.Time  `gorm:"column:createdAt;default:now()"`
}

func (gormPrescription) TableName() string { return "Prescription" }

type gormPrescriptionItem struct {
	ID             string    `gorm:"column:id;primaryKey"`
	PrescriptionID string    `gorm:"column:prescriptionId"`
	Name           string    `gorm:"column:name"`
	Dosage         *string   `gorm:"column:dosage"`
	Frequency      *string   `gorm:"column:frequency"`
	Days           *int      `gorm:"column:days"`
	SortOrder      int       `gorm:"column:sortOrder"`
	CreatedAt      time.Time `gorm:"column:createdAt;default:now()"`
}

func (gormPrescriptionItem) TableName() string { return "PrescriptionItem" }

type gormUser struct {
	ID                   string     `gorm:"column:id;primaryKey"`
	Email                string     `gorm:"column:email"`
	Password             string     `gorm:"column:password"`
	DisplayName          *string    `gorm:"column:displayName"`
	CharacterType        string     `gorm:"column:characterType;default:cat"`
	CharacterName        *string    `gorm:"column:characterName"`
	EmailVerified        bool       `gorm:"column:emailVerified"`
	VerificationCode     *string    `gorm:"column:verificationCode"`
	VerificationExpiry   *time.Time `gorm:"column:verificationExpiry"`
	VerificationAttempts int        `gorm:"column:verificationAttempts;default:0"`
	ResetCode            *string    `gorm:"column:resetCode"`
	ResetCodeExpiry      *time.Time `gorm:"column:resetCodeExpiry"`
	CreatedAt            time.Time  `gorm:"column:createdAt;default:now()"`
	UpdatedAt            time.Time  `gorm:"column:updatedAt;default:now()"`
}

func (gormUser) TableName() string { return "User" }

type gormNotificationSetting struct {
	ID                                   string    `gorm:"column:id;primaryKey"`
	UserID                               string    `gorm:"column:userId"`
	MedicationReminderEnabled            bool      `gorm:"column:medicationReminderEnabled"`
	MissedMedicationEnabled              bool      `gorm:"column:missedMedicationEnabled"`
	AppointmentReminderEnabled           bool      `gorm:"column:appointmentReminderEnabled"`
	LowStockAlertEnabled                 bool      `gorm:"column:lowStockAlertEnabled"`
	DefaultReminderMinutesBefore         int       `gorm:"column:defaultReminderMinutesBefore"`
	DefaultAppointmentReminderDaysBefore int       `gorm:"column:defaultAppointmentReminderDaysBefore"`
	EmailNotificationEnabled             bool      `gorm:"column:emailNotificationEnabled"`
	CreatedAt                            time.Time `gorm:"column:createdAt;default:now()"`
	UpdatedAt                            time.Time `gorm:"column:updatedAt;default:now()"`
}

func (gormNotificationSetting) TableName() string { return "NotificationSetting" }

type gormDashboardPreference struct {
	ID              string         `gorm:"column:id;primaryKey"`
	UserID          string         `gorm:"column:userId"`
	HiddenCards     pq.StringArray `gorm:"column:hiddenCards;type:text[]"`
	CardOrder       pq.StringArray `gorm:"column:cardOrder;type:text[]"`
	DefaultMemberID *string        `gorm:"column:defaultMemberId"`
	CreatedAt       time.Time      `gorm:"column:createdAt;default:now()"`
	UpdatedAt       time.Time      `gorm:"column:updatedAt;default:now()"`
}

func (gormDashboardPreference) TableName() string { return "DashboardPreference" }

type gormMedication struct {
	ID             string     `gorm:"column:id;primaryKey"`
	MemberID       string     `gorm:"column:memberId"`
	UserID         string     `gorm:"column:userId"`
	Name           string     `gorm:"column:name"`
	Category       string     `gorm:"column:category;default:regular"`
	DosageAmount   *string    `gorm:"column:dosageAmount"`
	Frequency      *string    `gorm:"column:frequency"`
	StockQuantity  *int       `gorm:"column:stockQuantity"`
	StockAlertDate *time.Time `gorm:"column:stockAlertDate"`
	IntervalHours  *int       `gorm:"column:intervalHours"`
	Instructions   *string    `gorm:"column:instructions"`
	DisplayOrder   int        `gorm:"column:displayOrder;default:0"`
	IsActive       bool       `gorm:"column:isActive;default:true"`
	Status         string     `gorm:"column:status;default:active"`
	CreatedAt      time.Time  `gorm:"column:createdAt;default:now()"`
	UpdatedAt      time.Time  `gorm:"column:updatedAt;default:now()"`
}

func (gormMedication) TableName() string { return "Medication" }

type gormHealthLog struct {
	ID             string         `gorm:"column:id;primaryKey"`
	UserID         string         `gorm:"column:userId"`
	MemberID       string         `gorm:"column:memberId"`
	ConditionLevel int            `gorm:"column:conditionLevel"`
	Symptoms       pq.StringArray `gorm:"column:symptoms;type:text[]"`
	Notes          *string        `gorm:"column:notes"`
	RecordedAt     time.Time      `gorm:"column:recordedAt;default:now()"`
}

func (gormHealthLog) TableName() string { return "HealthLog" }

type gormSchedule struct {
	ID                    string         `gorm:"column:id;primaryKey"`
	MedicationID          string         `gorm:"column:medicationId"`
	UserID                string         `gorm:"column:userId"`
	MemberID              string         `gorm:"column:memberId"`
	ScheduledTime         string         `gorm:"column:scheduledTime"`
	DaysOfWeek            pq.StringArray `gorm:"column:daysOfWeek;type:text[]"`
	IntervalDays          *int           `gorm:"column:intervalDays"`
	StartDate             *time.Time     `gorm:"column:startDate"`
	IsEnabled             bool           `gorm:"column:isEnabled"`
	ReminderMinutesBefore int            `gorm:"column:reminderMinutesBefore"`
	CreatedAt             time.Time      `gorm:"column:createdAt;default:now()"`
}

func (gormSchedule) TableName() string { return "Schedule" }

type gormMember struct {
	ID         string     `gorm:"column:id;primaryKey"`
	UserID     string     `gorm:"column:userId"`
	MemberType string     `gorm:"column:memberType"`
	Name       string     `gorm:"column:name"`
	PetType    *string    `gorm:"column:petType"`
	PhotoURL   *string    `gorm:"column:photoUrl"`
	BirthDate  *time.Time `gorm:"column:birthDate"`
	Notes      *string    `gorm:"column:notes"`
	CreatedAt  time.Time  `gorm:"column:createdAt;default:now()"`
	UpdatedAt  time.Time  `gorm:"column:updatedAt;default:now()"`
}

func (gormMember) TableName() string { return "Member" }

type gormMedicationRecord struct {
	ID           string    `gorm:"column:id;primaryKey"`
	MemberID     string    `gorm:"column:memberId"`
	MedicationID string    `gorm:"column:medicationId"`
	UserID       string    `gorm:"column:userId"`
	ScheduleID   *string   `gorm:"column:scheduleId"`
	TakenAt      time.Time `gorm:"column:takenAt;default:now()"`
	Notes        *string   `gorm:"column:notes"`
	DosageAmount *string   `gorm:"column:dosageAmount"`
}

func (gormMedicationRecord) TableName() string { return "MedicationRecord" }

type gormTemperatureRecord struct {
	ID          string    `gorm:"column:id;primaryKey"`
	UserID      string    `gorm:"column:userId"`
	MemberID    string    `gorm:"column:memberId"`
	Temperature float64   `gorm:"column:temperature"`
	MeasuredAt  time.Time `gorm:"column:measuredAt"`
	Notes       *string   `gorm:"column:notes"`
	CreatedAt   time.Time `gorm:"column:createdAt;default:now()"`
}

func (gormTemperatureRecord) TableName() string { return "TemperatureRecord" }

type gormHospital struct {
	ID           string    `gorm:"column:id;primaryKey"`
	UserID       string    `gorm:"column:userId"`
	Name         string    `gorm:"column:name"`
	HospitalType *string   `gorm:"column:hospitalType"`
	Address      *string   `gorm:"column:address"`
	PhoneNumber  *string   `gorm:"column:phoneNumber"`
	Department   *string   `gorm:"column:department"`
	DoctorName   *string   `gorm:"column:doctorName"`
	Notes        *string   `gorm:"column:notes"`
	CreatedAt    time.Time `gorm:"column:createdAt;default:now()"`
}

func (gormHospital) TableName() string { return "Hospital" }

type gormAllergy struct {
	ID           string     `gorm:"column:id;primaryKey"`
	UserID       string     `gorm:"column:userId"`
	MemberID     string     `gorm:"column:memberId"`
	AllergenName string     `gorm:"column:allergenName"`
	AllergyType  string     `gorm:"column:allergyType"`
	Severity     string     `gorm:"column:severity"`
	Symptoms     *string    `gorm:"column:symptoms"`
	DiagnosedAt  *time.Time `gorm:"column:diagnosedAt"`
	Notes        *string    `gorm:"column:notes"`
	CreatedAt    time.Time  `gorm:"column:createdAt;default:now()"`
}

func (gormAllergy) TableName() string { return "Allergy" }

type gormAppointment struct {
	ID                 string    `gorm:"column:id;primaryKey"`
	UserID             string    `gorm:"column:userId"`
	MemberID           string    `gorm:"column:memberId"`
	HospitalID         *string   `gorm:"column:hospitalId"`
	AppointmentType    *string   `gorm:"column:appointmentType"`
	AppointmentDate    time.Time `gorm:"column:appointmentDate"`
	Description        *string   `gorm:"column:description"`
	TestResults        *string   `gorm:"column:testResults"`
	Cost               *float64  `gorm:"column:cost"`
	ReminderEnabled    bool      `gorm:"column:reminderEnabled"`
	ReminderDaysBefore int       `gorm:"column:reminderDaysBefore"`
	CreatedAt          time.Time `gorm:"column:createdAt;default:now()"`
}

func (gormAppointment) TableName() string { return "Appointment" }

type gormBodyMeasurement struct {
	ID         string    `gorm:"column:id;primaryKey"`
	UserID     string    `gorm:"column:userId"`
	MemberID   string    `gorm:"column:memberId"`
	Weight     *float64  `gorm:"column:weight"`
	Height     *float64  `gorm:"column:height"`
	RecordedAt time.Time `gorm:"column:recordedAt"`
	Notes      *string   `gorm:"column:notes"`
	CreatedAt  time.Time `gorm:"column:createdAt;default:now()"`
}

func (gormBodyMeasurement) TableName() string { return "BodyMeasurement" }

type gormEmergencyContact struct {
	ID           string    `gorm:"column:id;primaryKey"`
	UserID       string    `gorm:"column:userId"`
	MemberID     string    `gorm:"column:memberId"`
	ContactName  string    `gorm:"column:contactName"`
	PhoneNumber  string    `gorm:"column:phoneNumber"`
	Relationship *string   `gorm:"column:relationship"`
	Notes        *string   `gorm:"column:notes"`
	CreatedAt    time.Time `gorm:"column:createdAt;default:now()"`
}

func (gormEmergencyContact) TableName() string { return "EmergencyContact" }

type gormExamination struct {
	ID                string     `gorm:"column:id;primaryKey"`
	UserID            string     `gorm:"column:userId"`
	MemberID          string     `gorm:"column:memberId"`
	ExaminationType   string     `gorm:"column:examinationType"`
	ExaminedAt        time.Time  `gorm:"column:examinedAt"`
	NextScheduledDate *time.Time `gorm:"column:nextScheduledDate"`
	Notes             *string    `gorm:"column:notes"`
	ImageData         *string    `gorm:"column:imageData"`
	CreatedAt         time.Time  `gorm:"column:createdAt;default:now()"`
}

func (gormExamination) TableName() string { return "Examination" }

type gormInsurance struct {
	ID            string    `gorm:"column:id;primaryKey"`
	UserID        string    `gorm:"column:userId"`
	MemberID      string    `gorm:"column:memberId"`
	InsuranceType string    `gorm:"column:insuranceType"`
	ProviderName  *string   `gorm:"column:providerName"`
	PolicyNumber  *string   `gorm:"column:policyNumber"`
	Notes         *string   `gorm:"column:notes"`
	CreatedAt     time.Time `gorm:"column:createdAt;default:now()"`
}

func (gormInsurance) TableName() string { return "Insurance" }

type gormVaccination struct {
	ID                string     `gorm:"column:id;primaryKey"`
	UserID            string     `gorm:"column:userId"`
	MemberID          string     `gorm:"column:memberId"`
	VaccineName       string     `gorm:"column:vaccineName"`
	VaccinatedAt      time.Time  `gorm:"column:vaccinatedAt"`
	NextScheduledDate *time.Time `gorm:"column:nextScheduledDate"`
	Notes             *string    `gorm:"column:notes"`
	CreatedAt         time.Time  `gorm:"column:createdAt;default:now()"`
}

func (gormVaccination) TableName() string { return "Vaccination" }
