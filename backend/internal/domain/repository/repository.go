package repository

import (
	"context"
	"errors"
	"time"

	"healthfamily/internal/domain/entity"
)

// UserRepository はユーザー永続化の抽象
// ErrCodeConsumed は、適用しようとした時点でコードが既に消えていたか、
// 別のコードに差し替わっていたことを表す。二重適用や、古い検証結果での
// 適用を防いだ結果であり、障害ではない。
var ErrCodeConsumed = errors.New("code already consumed or replaced")

// ErrAlreadyVerified は、書き込もうとした時点で対象が認証済みだったことを表す。
// 未認証前提の操作を認証済みアカウントに適用しないための歯止め。
var ErrAlreadyVerified = errors.New("account already verified")

// UserRepository は利用者の永続化。
//
// 更新は用途ごとに分ける。読み出したスナップショットを丸ごと書き戻す口を
// 1 つでも残すと、その間に走った資格情報の変更 (パスワード再設定など) を
// 巻き戻し、消費済みのコードまで復活させてしまう。
type UserRepository interface {
	FindByEmail(ctx context.Context, email string) (*entity.User, error)
	FindByID(ctx context.Context, id string) (*entity.User, error)
	FindByGoogleID(ctx context.Context, googleID string) (*entity.User, error)
	Create(ctx context.Context, u *entity.User) error

	// UpdateProfile は表示名・キャラクター設定だけを書き戻す。
	UpdateProfile(ctx context.Context, u *entity.User) error

	// SavePendingRegistration は未認証アカウントの登録内容を差し替える。
	// 認証済みだった場合は ErrAlreadyVerified を返し、上書きしない。
	SavePendingRegistration(ctx context.Context, id, hashedPassword string, displayName *string, code string, expiry time.Time) error
	// SaveVerificationCode は新しい認証コードを置き、失敗回数を戻す。
	SaveVerificationCode(ctx context.Context, id, code string, expiry time.Time) error
	// MarkEmailVerified は認証済みにし、使い終わったコードを捨てる。
	// 照合したコードを渡す。その間に再送で差し替わっていたら適用しない。
	MarkEmailVerified(ctx context.Context, id, verifiedCode string) error
	// ClaimVerificationAttempt は試行を1つ消費し、上限内であればコードを返す。
	// 比較の前に消費することで、並列に投げられても比較の回数そのものを縛る。
	ClaimVerificationAttempt(ctx context.Context, id string, max int) (code *string, expiresAt *time.Time, withinLimit bool, err error)

	// SaveResetCode は再設定コードを置き、その試行回数を戻す。
	SaveResetCode(ctx context.Context, id, code string, expiry time.Time) error
	// ClaimResetAttempt は再設定コードについて同じことを行う。
	ClaimResetAttempt(ctx context.Context, id string, max int) (code *string, expiresAt *time.Time, withinLimit bool, err error)
	// ApplyPasswordReset は照合したコードが残っている行にだけ新しいパスワードを
	// 設定し、世代を繰り上げる。差し替わっていれば ErrCodeConsumed を返す。
	ApplyPasswordReset(ctx context.Context, id, verifiedCode, hashedPassword string) error

	// LinkGoogle は Google アカウントを紐付ける。
	// resetCredentials が true なら、示されていないパスワードとコードを捨てる。
	LinkGoogle(ctx context.Context, id, subject string, resetCredentials bool, displayName *string) error

	// TokenVersion は発行済みトークンの世代を返す。found が false なら利用者が存在しない。
	TokenVersion(ctx context.Context, id string) (version int, found bool, err error)
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
