package persistence

import "time"

// GORM 用モデル。書き込み系(Create/Update/Delete)で利用する。
// 既存スキーマ(PascalCaseテーブル・camelCase列)に合わせて column タグを明示する。
// createdAt は DB 既定値(now())を使うため default タグを付け、ゼロ値時は INSERT から除外させる。

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
