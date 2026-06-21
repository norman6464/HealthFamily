package usecase

import (
	"context"
	"time"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// ScheduleUsecase はスケジュール管理のビジネスロジック
type ScheduleUsecase struct {
	schedules   repository.ScheduleRepository
	medications repository.MedicationRepository
}

func NewScheduleUsecase(schedules repository.ScheduleRepository, medications repository.MedicationRepository) *ScheduleUsecase {
	return &ScheduleUsecase{schedules: schedules, medications: medications}
}

func (uc *ScheduleUsecase) ensureOwner(ctx context.Context, userID, id string) (*entity.Schedule, error) {
	s, err := uc.schedules.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if s == nil {
		return nil, domain.NewNotFound("スケジュール")
	}
	if s.UserID != userID {
		return nil, domain.NewForbidden("このスケジュールにアクセスする権限がありません")
	}
	return s, nil
}

func (uc *ScheduleUsecase) List(ctx context.Context, userID string) ([]entity.Schedule, error) {
	return uc.schedules.ListByUser(ctx, userID)
}

func (uc *ScheduleUsecase) Today(ctx context.Context, userID string, date time.Time) ([]entity.TodaySchedule, error) {
	return uc.schedules.GetTodaySchedules(ctx, userID, date)
}

func (uc *ScheduleUsecase) Create(ctx context.Context, in repository.CreateScheduleInput) (*entity.Schedule, error) {
	med, err := uc.medications.FindByID(ctx, in.MedicationID)
	if err != nil {
		return nil, err
	}
	if med == nil {
		return nil, domain.NewNotFound("薬")
	}
	if med.UserID != in.UserID {
		return nil, domain.NewForbidden("この薬にアクセスする権限がありません")
	}
	in.MemberID = med.MemberID
	return uc.schedules.Create(ctx, in)
}

func (uc *ScheduleUsecase) Update(ctx context.Context, userID, id string, in repository.UpdateScheduleInput) (*entity.Schedule, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	return uc.schedules.Update(ctx, id, in)
}

func (uc *ScheduleUsecase) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.schedules.Delete(ctx, id)
}
