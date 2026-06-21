package entity

import "time"

// Hospital は病院（user スコープ）
type Hospital struct {
	ID           string    `json:"id"`
	UserID       string    `json:"userId"`
	Name         string    `json:"name"`
	HospitalType *string   `json:"hospitalType"`
	Address      *string   `json:"address"`
	PhoneNumber  *string   `json:"phoneNumber"`
	Department   *string   `json:"department"`
	DoctorName   *string   `json:"doctorName"`
	Notes        *string   `json:"notes"`
	CreatedAt    time.Time `json:"createdAt"`
}

// Appointment は通院予定・記録
type Appointment struct {
	ID                 string    `json:"id"`
	UserID             string    `json:"userId"`
	MemberID           string    `json:"memberId"`
	HospitalID         *string   `json:"hospitalId"`
	AppointmentType    *string   `json:"appointmentType"`
	AppointmentDate    time.Time `json:"appointmentDate"`
	Description        *string   `json:"description"`
	TestResults        *string   `json:"testResults"`
	Cost               *float64  `json:"cost"`
	ReminderEnabled    bool      `json:"reminderEnabled"`
	ReminderDaysBefore int       `json:"reminderDaysBefore"`
	CreatedAt          time.Time `json:"createdAt"`
}

// HealthLog は体調ログ
type HealthLog struct {
	ID             string    `json:"id"`
	UserID         string    `json:"userId"`
	MemberID       string    `json:"memberId"`
	ConditionLevel int       `json:"conditionLevel"`
	Symptoms       []string  `json:"symptoms"`
	Notes          *string   `json:"notes"`
	RecordedAt     time.Time `json:"recordedAt"`
}

// Vaccination は予防接種記録
type Vaccination struct {
	ID                string     `json:"id"`
	UserID            string     `json:"userId"`
	MemberID          string     `json:"memberId"`
	VaccineName       string     `json:"vaccineName"`
	VaccinatedAt      time.Time  `json:"vaccinatedAt"`
	NextScheduledDate *time.Time `json:"nextScheduledDate"`
	Notes             *string    `json:"notes"`
	CreatedAt         time.Time  `json:"createdAt"`
}

// Examination は検査記録
type Examination struct {
	ID                string     `json:"id"`
	UserID            string     `json:"userId"`
	MemberID          string     `json:"memberId"`
	ExaminationType   string     `json:"examinationType"`
	ExaminedAt        time.Time  `json:"examinedAt"`
	NextScheduledDate *time.Time `json:"nextScheduledDate"`
	Notes             *string    `json:"notes"`
	ImageData         *string    `json:"imageData"`
	CreatedAt         time.Time  `json:"createdAt"`
}

// Insurance は保険情報
type Insurance struct {
	ID            string    `json:"id"`
	UserID        string    `json:"userId"`
	MemberID      string    `json:"memberId"`
	InsuranceType string    `json:"insuranceType"`
	ProviderName  *string   `json:"providerName"`
	PolicyNumber  *string   `json:"policyNumber"`
	Notes         *string   `json:"notes"`
	CreatedAt     time.Time `json:"createdAt"`
}

// Allergy はアレルギー情報
type Allergy struct {
	ID           string     `json:"id"`
	UserID       string     `json:"userId"`
	MemberID     string     `json:"memberId"`
	AllergenName string     `json:"allergenName"`
	AllergyType  string     `json:"allergyType"`
	Severity     string     `json:"severity"`
	Symptoms     *string    `json:"symptoms"`
	DiagnosedAt  *time.Time `json:"diagnosedAt"`
	Notes        *string    `json:"notes"`
	CreatedAt    time.Time  `json:"createdAt"`
}

// BodyMeasurement は身体測定記録
type BodyMeasurement struct {
	ID         string    `json:"id"`
	UserID     string    `json:"userId"`
	MemberID   string    `json:"memberId"`
	Weight     *float64  `json:"weight"`
	Height     *float64  `json:"height"`
	RecordedAt time.Time `json:"recordedAt"`
	Notes      *string   `json:"notes"`
	CreatedAt  time.Time `json:"createdAt"`
}

// TemperatureRecord は体温記録
type TemperatureRecord struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	MemberID    string    `json:"memberId"`
	Temperature float64   `json:"temperature"`
	MeasuredAt  time.Time `json:"measuredAt"`
	Notes       *string   `json:"notes"`
	CreatedAt   time.Time `json:"createdAt"`
}

// EmergencyContact は緊急連絡先
type EmergencyContact struct {
	ID           string    `json:"id"`
	UserID       string    `json:"userId"`
	MemberID     string    `json:"memberId"`
	ContactName  string    `json:"contactName"`
	PhoneNumber  string    `json:"phoneNumber"`
	Relationship *string   `json:"relationship"`
	Notes        *string   `json:"notes"`
	CreatedAt    time.Time `json:"createdAt"`
}

// Prescription は処方箋
type Prescription struct {
	ID               string     `json:"id"`
	UserID           string     `json:"userId"`
	MemberID         string     `json:"memberId"`
	PrescriptionName string     `json:"prescriptionName"`
	PrescribedBy     *string    `json:"prescribedBy"`
	PrescribedAt     time.Time  `json:"prescribedAt"`
	ExpiresAt        *time.Time `json:"expiresAt"`
	PharmacyName     *string    `json:"pharmacyName"`
	Notes            *string    `json:"notes"`
	CreatedAt        time.Time  `json:"createdAt"`
}

// NotificationSetting は通知設定（user スコープ・UNIQUE）
type NotificationSetting struct {
	ID                                   string    `json:"id"`
	UserID                               string    `json:"userId"`
	MedicationReminderEnabled            bool      `json:"medicationReminderEnabled"`
	MissedMedicationEnabled              bool      `json:"missedMedicationEnabled"`
	AppointmentReminderEnabled           bool      `json:"appointmentReminderEnabled"`
	LowStockAlertEnabled                 bool      `json:"lowStockAlertEnabled"`
	DefaultReminderMinutesBefore         int       `json:"defaultReminderMinutesBefore"`
	DefaultAppointmentReminderDaysBefore int       `json:"defaultAppointmentReminderDaysBefore"`
	EmailNotificationEnabled             bool      `json:"emailNotificationEnabled"`
	CreatedAt                            time.Time `json:"createdAt"`
	UpdatedAt                            time.Time `json:"updatedAt"`
}
