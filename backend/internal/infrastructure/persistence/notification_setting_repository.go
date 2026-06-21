package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/pkg/auth"
)

// NotificationSettingRepository は "NotificationSetting" テーブルの生SQL実装
type NotificationSettingRepository struct {
	db *database.DB
}

func NewNotificationSettingRepository(db *database.DB) *NotificationSettingRepository {
	return &NotificationSettingRepository{db: db}
}

const notificationSettingColumns = `"id", "userId", "medicationReminderEnabled", "missedMedicationEnabled",
	"appointmentReminderEnabled", "lowStockAlertEnabled", "defaultReminderMinutesBefore",
	"defaultAppointmentReminderDaysBefore", "emailNotificationEnabled", "createdAt", "updatedAt"`

func scanNotificationSetting(row pgx.Row) (*entity.NotificationSetting, error) {
	var n entity.NotificationSetting
	err := row.Scan(&n.ID, &n.UserID, &n.MedicationReminderEnabled, &n.MissedMedicationEnabled,
		&n.AppointmentReminderEnabled, &n.LowStockAlertEnabled, &n.DefaultReminderMinutesBefore,
		&n.DefaultAppointmentReminderDaysBefore, &n.EmailNotificationEnabled, &n.CreatedAt, &n.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *NotificationSettingRepository) FindByUserID(ctx context.Context, userID string) (*entity.NotificationSetting, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+notificationSettingColumns+` FROM "NotificationSetting" WHERE "userId"=$1`, userID)
	return scanNotificationSetting(row)
}

func (r *NotificationSettingRepository) Upsert(ctx context.Context, in repository.UpsertNotificationSettingInput) (*entity.NotificationSetting, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "NotificationSetting" ("id", "userId", "medicationReminderEnabled", "missedMedicationEnabled",
			"appointmentReminderEnabled", "lowStockAlertEnabled", "defaultReminderMinutesBefore",
			"defaultAppointmentReminderDaysBefore", "emailNotificationEnabled", "createdAt", "updatedAt")
		 VALUES ($1, $2, COALESCE($3, TRUE), COALESCE($4, TRUE), COALESCE($5, TRUE), COALESCE($6, TRUE),
			COALESCE($7, 5), COALESCE($8, 1), COALESCE($9, TRUE), now(), now())
		 ON CONFLICT ("userId") DO UPDATE SET
			"medicationReminderEnabled" = COALESCE($3, "NotificationSetting"."medicationReminderEnabled"),
			"missedMedicationEnabled" = COALESCE($4, "NotificationSetting"."missedMedicationEnabled"),
			"appointmentReminderEnabled" = COALESCE($5, "NotificationSetting"."appointmentReminderEnabled"),
			"lowStockAlertEnabled" = COALESCE($6, "NotificationSetting"."lowStockAlertEnabled"),
			"defaultReminderMinutesBefore" = COALESCE($7, "NotificationSetting"."defaultReminderMinutesBefore"),
			"defaultAppointmentReminderDaysBefore" = COALESCE($8, "NotificationSetting"."defaultAppointmentReminderDaysBefore"),
			"emailNotificationEnabled" = COALESCE($9, "NotificationSetting"."emailNotificationEnabled"),
			"updatedAt" = now()
		 RETURNING `+notificationSettingColumns,
		id, in.UserID, in.MedicationReminderEnabled, in.MissedMedicationEnabled,
		in.AppointmentReminderEnabled, in.LowStockAlertEnabled, in.DefaultReminderMinutesBefore,
		in.DefaultAppointmentReminderDaysBefore, in.EmailNotificationEnabled)
	return scanNotificationSetting(row)
}
