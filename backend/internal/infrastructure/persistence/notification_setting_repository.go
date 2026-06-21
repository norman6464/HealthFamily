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

// NotificationSettingRepository は notification_settings テーブルの生SQL実装
type NotificationSettingRepository struct {
	db *database.DB
}

func NewNotificationSettingRepository(db *database.DB) *NotificationSettingRepository {
	return &NotificationSettingRepository{db: db}
}

const notificationSettingColumns = `id, user_id, push_enabled, email_enabled, reminder_enabled, created_at, updated_at`

func scanNotificationSetting(row pgx.Row) (*entity.NotificationSetting, error) {
	var n entity.NotificationSetting
	err := row.Scan(&n.ID, &n.UserID, &n.PushEnabled, &n.EmailEnabled, &n.ReminderEnabled, &n.CreatedAt, &n.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *NotificationSettingRepository) FindByUserID(ctx context.Context, userID string) (*entity.NotificationSetting, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+notificationSettingColumns+` FROM notification_settings WHERE user_id=$1`, userID)
	return scanNotificationSetting(row)
}

func (r *NotificationSettingRepository) Upsert(ctx context.Context, in repository.UpsertNotificationSettingInput) (*entity.NotificationSetting, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO notification_settings (id, user_id, push_enabled, email_enabled, reminder_enabled, created_at, updated_at)
		 VALUES ($1, $2, COALESCE($3, FALSE), COALESCE($4, FALSE), COALESCE($5, TRUE), now(), now())
		 ON CONFLICT (user_id) DO UPDATE SET
			push_enabled = COALESCE($3, notification_settings.push_enabled),
			email_enabled = COALESCE($4, notification_settings.email_enabled),
			reminder_enabled = COALESCE($5, notification_settings.reminder_enabled),
			updated_at = now()
		 RETURNING `+notificationSettingColumns,
		id, in.UserID, in.PushEnabled, in.EmailEnabled, in.ReminderEnabled)
	return scanNotificationSetting(row)
}
