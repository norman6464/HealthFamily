package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// TemperatureRecordUsecase は体温記録のビジネスロジック
type TemperatureRecordUsecase struct {
	repo    repository.TemperatureRecordRepository
	members repository.MemberRepository
}

func NewTemperatureRecordUsecase(repo repository.TemperatureRecordRepository, members repository.MemberRepository) *TemperatureRecordUsecase {
	return &TemperatureRecordUsecase{repo: repo, members: members}
}

func (uc *TemperatureRecordUsecase) ensureOwner(ctx context.Context, userID, id string) (*entity.TemperatureRecord, error) {
	t, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if t == nil {
		return nil, domain.NewNotFound("体温記録")
	}
	if t.UserID != userID {
		return nil, domain.NewForbidden("この体温記録にアクセスする権限がありません")
	}
	return t, nil
}

func (uc *TemperatureRecordUsecase) List(ctx context.Context, userID string) ([]entity.TemperatureRecord, error) {
	return uc.repo.List(ctx, userID)
}

func (uc *TemperatureRecordUsecase) ListByMember(ctx context.Context, userID, memberID string) ([]entity.TemperatureRecord, error) {
	if err := ensureMemberOwner(ctx, uc.members, userID, memberID); err != nil {
		return nil, err
	}
	return uc.repo.ListByMember(ctx, memberID)
}

func (uc *TemperatureRecordUsecase) Get(ctx context.Context, userID, id string) (*entity.TemperatureRecord, error) {
	return uc.ensureOwner(ctx, userID, id)
}

func (uc *TemperatureRecordUsecase) Create(ctx context.Context, in repository.CreateTemperatureRecordInput) (*entity.TemperatureRecord, error) {
	if err := ensureMemberOwner(ctx, uc.members, in.UserID, in.MemberID); err != nil {
		return nil, err
	}
	return uc.repo.Create(ctx, in)
}

func (uc *TemperatureRecordUsecase) Update(ctx context.Context, userID, id string, in repository.UpdateTemperatureRecordInput) (*entity.TemperatureRecord, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	return uc.repo.Update(ctx, id, in)
}

func (uc *TemperatureRecordUsecase) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.repo.Delete(ctx, id)
}
