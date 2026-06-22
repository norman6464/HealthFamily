package repository

import (
	"context"
	"time"

	"healthfamily/internal/domain/entity"
)

// UserRepository はユーザー永続化の抽象
type UserRepository interface {
	FindByEmail(ctx context.Context, email string) (*entity.User, error)
	FindByID(ctx context.Context, id string) (*entity.User, error)
	Create(ctx context.Context, u *entity.User) error
	Update(ctx context.Context, u *entity.User) error
}

// CreateMemberInput はメンバー作成入力
type CreateMemberInput struct {
	UserID     string
	Name       string
	MemberType string
	PetType    *string
	BirthDate  *time.Time
	Notes      *string
}

// UpdateMemberInput はメンバー更新入力（nilは未変更）
type UpdateMemberInput struct {
	Name      *string
	PetType   *string
	BirthDate *time.Time
	Notes     *string
}

// MemberRepository はメンバー永続化の抽象
type MemberRepository interface {
	List(ctx context.Context, userID string) ([]entity.Member, error)
	ListSummary(ctx context.Context, userID string) ([]entity.MemberSummary, error)
	FindByID(ctx context.Context, id string) (*entity.Member, error)
	Create(ctx context.Context, in CreateMemberInput) (*entity.Member, error)
	Update(ctx context.Context, id string, in UpdateMemberInput) (*entity.Member, error)
	Delete(ctx context.Context, id string) error
}

// CreateMedicationInput は薬作成入力
type CreateMedicationInput struct {
	UserID         string
	MemberID       string
	Name           string
	Category       string
	DosageAmount   *string
	Frequency      *string
	StockQuantity  *int
	StockAlertDate *time.Time
	Instructions   *string
}

// UpdateMedicationInput は薬更新入力
type UpdateMedicationInput struct {
	Name           *string
	Category       *string
	DosageAmount   *string
	Frequency      *string
	StockQuantity  *int
	StockAlertDate *time.Time
	Instructions   *string
	IsActive       *bool
	Status         *string
}

// MedicationRepository は薬永続化の抽象
type MedicationRepository interface {
	ListByMember(ctx context.Context, memberID string) ([]entity.Medication, error)
	ListByUser(ctx context.Context, userID string) ([]entity.Medication, error)
	FindByID(ctx context.Context, id string) (*entity.Medication, error)
	ListAlerts(ctx context.Context, userID string) ([]entity.Medication, error)
	Create(ctx context.Context, in CreateMedicationInput) (*entity.Medication, error)
	Update(ctx context.Context, id string, in UpdateMedicationInput) (*entity.Medication, error)
	UpdateStock(ctx context.Context, id string, quantity int) (*entity.Medication, error)
	Reorder(ctx context.Context, userID string, orderedIDs []string) error
	Delete(ctx context.Context, id string) error
}

// CreateScheduleInput はスケジュール作成入力
type CreateScheduleInput struct {
	MedicationID          string
	UserID                string
	MemberID              string
	ScheduledTime         string
	DaysOfWeek            []string
	IntervalDays          *int
	StartDate             *time.Time
	IsEnabled             bool
	ReminderMinutesBefore int
}

// UpdateScheduleInput はスケジュール更新入力
type UpdateScheduleInput struct {
	ScheduledTime         *string
	DaysOfWeek            []string
	IntervalDays          *int
	StartDate             *time.Time
	IsEnabled             *bool
	ReminderMinutesBefore *int
}

// ScheduleRepository はスケジュール永続化の抽象
type ScheduleRepository interface {
	ListByUser(ctx context.Context, userID string) ([]entity.Schedule, error)
	FindByID(ctx context.Context, id string) (*entity.Schedule, error)
	Create(ctx context.Context, in CreateScheduleInput) (*entity.Schedule, error)
	Update(ctx context.Context, id string, in UpdateScheduleInput) (*entity.Schedule, error)
	Delete(ctx context.Context, id string) error
	GetTodaySchedules(ctx context.Context, userID string, date time.Time) ([]entity.TodaySchedule, error)
}

// CreateRecordInput は服薬記録作成入力
type CreateRecordInput struct {
	UserID       string
	MemberID     string
	MedicationID string
	ScheduleID   *string
	Notes        *string
	DosageAmount *string
	TakenAt      *time.Time
}

// RecordFilter は服薬記録の絞り込み条件（任意。ゼロ値は無指定）
type RecordFilter struct {
	MemberID string     // 空なら全メンバー
	From     *time.Time // takenAt >= From
	To       *time.Time // takenAt <  To
	Limit    int        // 0なら無制限
}

// MedicationRecordRepository は服薬記録永続化の抽象
type MedicationRecordRepository interface {
	ListByUser(ctx context.Context, userID string) ([]entity.MedicationRecord, error)
	ListByUserFiltered(ctx context.Context, userID string, f RecordFilter) ([]entity.MedicationRecord, error)
	ListByMember(ctx context.Context, memberID string) ([]entity.MedicationRecord, error)
	FindByID(ctx context.Context, id string) (*entity.MedicationRecord, error)
	Create(ctx context.Context, in CreateRecordInput) (*entity.MedicationRecord, error)
	Delete(ctx context.Context, id string) error
}
