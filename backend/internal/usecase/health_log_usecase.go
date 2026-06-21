package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// HealthLogUsecase は体調ログのビジネスロジック
type HealthLogUsecase struct {
	repo    repository.HealthLogRepository
	members repository.MemberRepository
}

func NewHealthLogUsecase(repo repository.HealthLogRepository, members repository.MemberRepository) *HealthLogUsecase {
	return &HealthLogUsecase{repo: repo, members: members}
}

func (uc *HealthLogUsecase) ensureOwner(ctx context.Context, userID, id string) (*entity.HealthLog, error) {
	h, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if h == nil {
		return nil, domain.NewNotFound("体調ログ")
	}
	if h.UserID != userID {
		return nil, domain.NewForbidden("この体調ログにアクセスする権限がありません")
	}
	return h, nil
}

func (uc *HealthLogUsecase) List(ctx context.Context, userID string) ([]entity.HealthLog, error) {
	return uc.repo.List(ctx, userID)
}

func (uc *HealthLogUsecase) Get(ctx context.Context, userID, id string) (*entity.HealthLog, error) {
	return uc.ensureOwner(ctx, userID, id)
}

func (uc *HealthLogUsecase) Create(ctx context.Context, in repository.CreateHealthLogInput) (*entity.HealthLog, error) {
	if err := ensureMemberOwner(ctx, uc.members, in.UserID, in.MemberID); err != nil {
		return nil, err
	}
	return uc.repo.Create(ctx, in)
}

func (uc *HealthLogUsecase) Update(ctx context.Context, userID, id string, in repository.UpdateHealthLogInput) (*entity.HealthLog, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	return uc.repo.Update(ctx, id, in)
}

func (uc *HealthLogUsecase) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.repo.Delete(ctx, id)
}
