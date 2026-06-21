package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// InsuranceUsecase は保険のビジネスロジック
type InsuranceUsecase struct {
	repo    repository.InsuranceRepository
	members repository.MemberRepository
}

func NewInsuranceUsecase(repo repository.InsuranceRepository, members repository.MemberRepository) *InsuranceUsecase {
	return &InsuranceUsecase{repo: repo, members: members}
}

func (uc *InsuranceUsecase) ensureOwner(ctx context.Context, userID, id string) (*entity.Insurance, error) {
	i, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if i == nil {
		return nil, domain.NewNotFound("保険")
	}
	if i.UserID != userID {
		return nil, domain.NewForbidden("この保険にアクセスする権限がありません")
	}
	return i, nil
}

func (uc *InsuranceUsecase) List(ctx context.Context, userID string) ([]entity.Insurance, error) {
	return uc.repo.List(ctx, userID)
}

func (uc *InsuranceUsecase) Get(ctx context.Context, userID, id string) (*entity.Insurance, error) {
	return uc.ensureOwner(ctx, userID, id)
}

func (uc *InsuranceUsecase) Create(ctx context.Context, in repository.CreateInsuranceInput) (*entity.Insurance, error) {
	if err := ensureMemberOwner(ctx, uc.members, in.UserID, in.MemberID); err != nil {
		return nil, err
	}
	return uc.repo.Create(ctx, in)
}

func (uc *InsuranceUsecase) Update(ctx context.Context, userID, id string, in repository.UpdateInsuranceInput) (*entity.Insurance, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	return uc.repo.Update(ctx, id, in)
}

func (uc *InsuranceUsecase) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.repo.Delete(ctx, id)
}
