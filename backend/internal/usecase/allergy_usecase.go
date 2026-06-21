package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// AllergyUsecase はアレルギーのビジネスロジック
type AllergyUsecase struct {
	repo    repository.AllergyRepository
	members repository.MemberRepository
}

func NewAllergyUsecase(repo repository.AllergyRepository, members repository.MemberRepository) *AllergyUsecase {
	return &AllergyUsecase{repo: repo, members: members}
}

func (uc *AllergyUsecase) ensureOwner(ctx context.Context, userID, id string) (*entity.Allergy, error) {
	a, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if a == nil {
		return nil, domain.NewNotFound("アレルギー")
	}
	if a.UserID != userID {
		return nil, domain.NewForbidden("このアレルギー情報にアクセスする権限がありません")
	}
	return a, nil
}

func (uc *AllergyUsecase) List(ctx context.Context, userID string) ([]entity.Allergy, error) {
	return uc.repo.List(ctx, userID)
}

func (uc *AllergyUsecase) Get(ctx context.Context, userID, id string) (*entity.Allergy, error) {
	return uc.ensureOwner(ctx, userID, id)
}

func (uc *AllergyUsecase) Create(ctx context.Context, in repository.CreateAllergyInput) (*entity.Allergy, error) {
	if err := ensureMemberOwner(ctx, uc.members, in.UserID, in.MemberID); err != nil {
		return nil, err
	}
	return uc.repo.Create(ctx, in)
}

func (uc *AllergyUsecase) Update(ctx context.Context, userID, id string, in repository.UpdateAllergyInput) (*entity.Allergy, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	return uc.repo.Update(ctx, id, in)
}

func (uc *AllergyUsecase) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.repo.Delete(ctx, id)
}
