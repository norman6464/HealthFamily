package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// AppointmentUsecase は通院予定のビジネスロジック
type AppointmentUsecase struct {
	repo    repository.AppointmentRepository
	members repository.MemberRepository
}

func NewAppointmentUsecase(repo repository.AppointmentRepository, members repository.MemberRepository) *AppointmentUsecase {
	return &AppointmentUsecase{repo: repo, members: members}
}

func (uc *AppointmentUsecase) ensureOwner(ctx context.Context, userID, id string) (*entity.Appointment, error) {
	a, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if a == nil {
		return nil, domain.NewNotFound("通院予定")
	}
	if a.UserID != userID {
		return nil, domain.NewForbidden("この通院予定にアクセスする権限がありません")
	}
	return a, nil
}

func (uc *AppointmentUsecase) List(ctx context.Context, userID string) ([]entity.Appointment, error) {
	return uc.repo.List(ctx, userID)
}

func (uc *AppointmentUsecase) Get(ctx context.Context, userID, id string) (*entity.Appointment, error) {
	return uc.ensureOwner(ctx, userID, id)
}

func (uc *AppointmentUsecase) Create(ctx context.Context, in repository.CreateAppointmentInput) (*entity.Appointment, error) {
	if err := ensureMemberOwner(ctx, uc.members, in.UserID, in.MemberID); err != nil {
		return nil, err
	}
	return uc.repo.Create(ctx, in)
}

func (uc *AppointmentUsecase) Update(ctx context.Context, userID, id string, in repository.UpdateAppointmentInput) (*entity.Appointment, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	return uc.repo.Update(ctx, id, in)
}

func (uc *AppointmentUsecase) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.repo.Delete(ctx, id)
}
