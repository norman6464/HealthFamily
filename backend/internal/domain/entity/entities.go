package entity

import "time"

// User はアカウント
type User struct {
	ID                   string     `json:"id"`
	Email                string     `json:"email"`
	Password             string     `json:"-"`
	DisplayName          *string    `json:"displayName"`
	CharacterType        string     `json:"characterType"`
	CharacterName        *string    `json:"characterName"`
	EmailVerified        bool       `json:"emailVerified"`
	VerificationCode     *string    `json:"-"`
	VerificationExpiry   *time.Time `json:"-"`
	VerificationAttempts int        `json:"-"`
	ResetCode            *string    `json:"-"`
	ResetCodeExpiry      *time.Time `json:"-"`
	ResetAttempts        int        `json:"-"`
	// 発行済みトークンの世代。再設定で繰り上げ、古いトークンを失効させる
	TokenVersion int       `json:"-"`
	GoogleID     *string   `json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// Member は家族・ペットのメンバー
type Member struct {
	ID         string     `json:"id"`
	UserID     string     `json:"userId"`
	MemberType string     `json:"memberType"`
	Name       string     `json:"name"`
	PetType    *string    `json:"petType"`
	PhotoURL   *string    `json:"photoUrl"`
	BirthDate  *time.Time `json:"birthDate"`
	Notes      *string    `json:"notes"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
}

// Medication は薬
type Medication struct {
	ID             string     `json:"id"`
	MemberID       string     `json:"memberId"`
	UserID         string     `json:"userId"`
	Name           string     `json:"name"`
	Category       string     `json:"category"`
	DosageAmount   *string    `json:"dosageAmount"`
	Frequency      *string    `json:"frequency"`
	StockQuantity  *int       `json:"stockQuantity"`
	StockAlertDate *time.Time `json:"stockAlertDate"`
	IntervalHours  *int       `json:"intervalHours"`
	Instructions   *string    `json:"instructions"`
	DisplayOrder   int        `json:"displayOrder"`
	IsActive       bool       `json:"isActive"`
	Status         string     `json:"status"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

// Schedule は服薬スケジュール
type Schedule struct {
	ID                    string     `json:"id"`
	MedicationID          string     `json:"medicationId"`
	UserID                string     `json:"userId"`
	MemberID              string     `json:"memberId"`
	ScheduledTime         string     `json:"scheduledTime"`
	DaysOfWeek            []string   `json:"daysOfWeek"`
	IntervalDays          *int       `json:"intervalDays"`
	StartDate             *time.Time `json:"startDate"`
	IsEnabled             bool       `json:"isEnabled"`
	ReminderMinutesBefore int        `json:"reminderMinutesBefore"`
	CreatedAt             time.Time  `json:"createdAt"`
}

// MedicationRecord は服薬記録
type MedicationRecord struct {
	ID           string    `json:"id"`
	MemberID     string    `json:"memberId"`
	MedicationID string    `json:"medicationId"`
	UserID       string    `json:"userId"`
	ScheduleID   *string   `json:"scheduleId"`
	TakenAt      time.Time `json:"takenAt"`
	Notes        *string   `json:"notes"`
	DosageAmount *string   `json:"dosageAmount"`
}

// MemberSummary はメンバーと薬数の集計（一覧画面向けの読み取りモデル、N+1回避）
type MemberSummary struct {
	Member
	MedicationCount       int `json:"medicationCount"`
	ActiveMedicationCount int `json:"activeMedicationCount"`
}

// TodaySchedule は今日の服薬予定（薬・メンバー情報を結合した読み取りモデル）
type TodaySchedule struct {
	Schedule
	MedicationName         string `json:"medicationName"`
	MemberName             string `json:"memberName"`
	MemberType             string `json:"memberType"`
	MedicationDisplayOrder int    `json:"medicationDisplayOrder"`
	IsCompleted            bool   `json:"isCompleted"`
}
