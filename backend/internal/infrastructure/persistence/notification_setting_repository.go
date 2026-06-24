package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/sqlc/sqlcgen"
	"healthfamily/internal/pkg/auth"
)

// NotificationSettingRepository は "NotificationSetting" テーブルのリポジトリ。
// 検索系(FindByUserID)は sqlc、書き込み系(Upsert)は GORM(ON CONFLICT)を使う。
type NotificationSettingRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewNotificationSettingRepository(db *database.DB) *NotificationSettingRepository {
	return &NotificationSettingRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func notificationSettingFromSqlc(n sqlcgen.NotificationSetting) entity.NotificationSetting {
	return entity.NotificationSetting{
		ID:                                   n.ID,
		UserID:                               n.UserId,
		MedicationReminderEnabled:            n.MedicationReminderEnabled,
		MissedMedicationEnabled:              n.MissedMedicationEnabled,
		AppointmentReminderEnabled:           n.AppointmentReminderEnabled,
		LowStockAlertEnabled:                 n.LowStockAlertEnabled,
		DefaultReminderMinutesBefore:         int(n.DefaultReminderMinutesBefore),
		DefaultAppointmentReminderDaysBefore: int(n.DefaultAppointmentReminderDaysBefore),
		EmailNotificationEnabled:             n.EmailNotificationEnabled,
		CreatedAt:                            n.CreatedAt,
		UpdatedAt:                            n.UpdatedAt,
	}
}

func (r *NotificationSettingRepository) FindByUserID(ctx context.Context, userID string) (*entity.NotificationSetting, error) {
	n, err := r.q.GetNotificationSettingByUserID(ctx, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := notificationSettingFromSqlc(n)
	return &e, nil
}

func boolOr(p *bool, def bool) bool {
	if p != nil {
		return *p
	}
	return def
}

func intOr(p *int, def int) int {
	if p != nil {
		return *p
	}
	return def
}

func (r *NotificationSettingRepository) Upsert(ctx context.Context, in repository.UpsertNotificationSettingInput) (*entity.NotificationSetting, error) {
	// INSERT 時は未指定を既定値(TRUE/5/1)で埋める。
	rec := gormNotificationSetting{
		ID:                                   auth.NewID(),
		UserID:                               in.UserID,
		MedicationReminderEnabled:            boolOr(in.MedicationReminderEnabled, true),
		MissedMedicationEnabled:              boolOr(in.MissedMedicationEnabled, true),
		AppointmentReminderEnabled:           boolOr(in.AppointmentReminderEnabled, true),
		LowStockAlertEnabled:                 boolOr(in.LowStockAlertEnabled, true),
		DefaultReminderMinutesBefore:         intOr(in.DefaultReminderMinutesBefore, 5),
		DefaultAppointmentReminderDaysBefore: intOr(in.DefaultAppointmentReminderDaysBefore, 1),
		EmailNotificationEnabled:             boolOr(in.EmailNotificationEnabled, true),
	}
	// CONFLICT 時は指定された項目のみ更新(未指定は既存値を維持)。
	assignments := map[string]any{"updatedAt": gorm.Expr("now()")}
	if in.MedicationReminderEnabled != nil {
		assignments["medicationReminderEnabled"] = *in.MedicationReminderEnabled
	}
	if in.MissedMedicationEnabled != nil {
		assignments["missedMedicationEnabled"] = *in.MissedMedicationEnabled
	}
	if in.AppointmentReminderEnabled != nil {
		assignments["appointmentReminderEnabled"] = *in.AppointmentReminderEnabled
	}
	if in.LowStockAlertEnabled != nil {
		assignments["lowStockAlertEnabled"] = *in.LowStockAlertEnabled
	}
	if in.DefaultReminderMinutesBefore != nil {
		assignments["defaultReminderMinutesBefore"] = *in.DefaultReminderMinutesBefore
	}
	if in.DefaultAppointmentReminderDaysBefore != nil {
		assignments["defaultAppointmentReminderDaysBefore"] = *in.DefaultAppointmentReminderDaysBefore
	}
	if in.EmailNotificationEnabled != nil {
		assignments["emailNotificationEnabled"] = *in.EmailNotificationEnabled
	}

	if err := r.gdb.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "userId"}},
		DoUpdates: clause.Assignments(assignments),
	}).Create(&rec).Error; err != nil {
		return nil, err
	}
	return r.FindByUserID(ctx, in.UserID)
}
