package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// BodyMeasurementUsecase は身体測定のビジネスロジック
type BodyMeasurementUsecase struct {
	repo    repository.BodyMeasurementRepository
	members repository.MemberRepository
}

func NewBodyMeasurementUsecase(repo repository.BodyMeasurementRepository, members repository.MemberRepository) *BodyMeasurementUsecase {
	return &BodyMeasurementUsecase{repo: repo, members: members}
}

func (uc *BodyMeasurementUsecase) ensureOwner(ctx context.Context, userID, id string) (*entity.BodyMeasurement, error) {
	b, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if b == nil {
		return nil, domain.NewNotFound("身体測定記録")
	}
	if b.UserID != userID {
		return nil, domain.NewForbidden("この身体測定記録にアクセスする権限がありません")
	}
	return b, nil
}

func (uc *BodyMeasurementUsecase) List(ctx context.Context, userID string) ([]entity.BodyMeasurement, error) {
	return uc.repo.List(ctx, userID)
}

func (uc *BodyMeasurementUsecase) Get(ctx context.Context, userID, id string) (*entity.BodyMeasurement, error) {
	return uc.ensureOwner(ctx, userID, id)
}

func (uc *BodyMeasurementUsecase) Create(ctx context.Context, in repository.CreateBodyMeasurementInput) (*entity.BodyMeasurement, error) {
	if err := ensureMemberOwner(ctx, uc.members, in.UserID, in.MemberID); err != nil {
		return nil, err
	}
	return uc.repo.Create(ctx, in)
}

func (uc *BodyMeasurementUsecase) Update(ctx context.Context, userID, id string, in repository.UpdateBodyMeasurementInput) (*entity.BodyMeasurement, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	return uc.repo.Update(ctx, id, in)
}

func (uc *BodyMeasurementUsecase) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.repo.Delete(ctx, id)
}
