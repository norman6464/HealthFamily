package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// VaccinationUsecase は予防接種のビジネスロジック
type VaccinationUsecase struct {
	repo    repository.VaccinationRepository
	members repository.MemberRepository
}

func NewVaccinationUsecase(repo repository.VaccinationRepository, members repository.MemberRepository) *VaccinationUsecase {
	return &VaccinationUsecase{repo: repo, members: members}
}

func (uc *VaccinationUsecase) ensureOwner(ctx context.Context, userID, id string) (*entity.Vaccination, error) {
	v, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if v == nil {
		return nil, domain.NewNotFound("予防接種")
	}
	if v.UserID != userID {
		return nil, domain.NewForbidden("この予防接種にアクセスする権限がありません")
	}
	return v, nil
}

func (uc *VaccinationUsecase) List(ctx context.Context, userID string) ([]entity.Vaccination, error) {
	return uc.repo.List(ctx, userID)
}

func (uc *VaccinationUsecase) Get(ctx context.Context, userID, id string) (*entity.Vaccination, error) {
	return uc.ensureOwner(ctx, userID, id)
}

func (uc *VaccinationUsecase) Create(ctx context.Context, in repository.CreateVaccinationInput) (*entity.Vaccination, error) {
	if err := ensureMemberOwner(ctx, uc.members, in.UserID, in.MemberID); err != nil {
		return nil, err
	}
	return uc.repo.Create(ctx, in)
}

func (uc *VaccinationUsecase) Update(ctx context.Context, userID, id string, in repository.UpdateVaccinationInput) (*entity.Vaccination, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	return uc.repo.Update(ctx, id, in)
}

func (uc *VaccinationUsecase) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.repo.Delete(ctx, id)
}
