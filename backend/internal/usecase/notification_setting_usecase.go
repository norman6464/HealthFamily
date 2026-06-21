package usecase

import (
	"context"

	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// NotificationSettingUsecase は通知設定のビジネスロジック（user スコープ）
type NotificationSettingUsecase struct {
	repo repository.NotificationSettingRepository
}

func NewNotificationSettingUsecase(repo repository.NotificationSettingRepository) *NotificationSettingUsecase {
	return &NotificationSettingUsecase{repo: repo}
}

// Get は通知設定を返す。未作成ならデフォルト値を返す。
func (uc *NotificationSettingUsecase) Get(ctx context.Context, userID string) (*entity.NotificationSetting, error) {
	s, err := uc.repo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if s == nil {
		return &entity.NotificationSetting{
			UserID:                               userID,
			MedicationReminderEnabled:            true,
			MissedMedicationEnabled:              true,
			AppointmentReminderEnabled:           true,
			LowStockAlertEnabled:                 true,
			DefaultReminderMinutesBefore:         5,
			DefaultAppointmentReminderDaysBefore: 1,
			EmailNotificationEnabled:             true,
		}, nil
	}
	return s, nil
}

func (uc *NotificationSettingUsecase) Upsert(ctx context.Context, in repository.UpsertNotificationSettingInput) (*entity.NotificationSetting, error) {
	return uc.repo.Upsert(ctx, in)
}
