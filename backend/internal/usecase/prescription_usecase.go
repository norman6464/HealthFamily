package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// PrescriptionUsecase は処方箋のビジネスロジック
type PrescriptionUsecase struct {
	repo    repository.PrescriptionRepository
	members repository.MemberRepository
}

func NewPrescriptionUsecase(repo repository.PrescriptionRepository, members repository.MemberRepository) *PrescriptionUsecase {
	return &PrescriptionUsecase{repo: repo, members: members}
}

func (uc *PrescriptionUsecase) ensureOwner(ctx context.Context, userID, id string) (*entity.Prescription, error) {
	p, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, domain.NewNotFound("処方箋")
	}
	if p.UserID != userID {
		return nil, domain.NewForbidden("この処方箋にアクセスする権限がありません")
	}
	return p, nil
}

func (uc *PrescriptionUsecase) List(ctx context.Context, userID string) ([]entity.Prescription, error) {
	return uc.repo.List(ctx, userID)
}

func (uc *PrescriptionUsecase) Get(ctx context.Context, userID, id string) (*entity.Prescription, error) {
	return uc.ensureOwner(ctx, userID, id)
}

func (uc *PrescriptionUsecase) Create(ctx context.Context, in repository.CreatePrescriptionInput) (*entity.Prescription, error) {
	if err := ensureMemberOwner(ctx, uc.members, in.UserID, in.MemberID); err != nil {
		return nil, err
	}
	return uc.repo.Create(ctx, in)
}

func (uc *PrescriptionUsecase) Update(ctx context.Context, userID, id string, in repository.UpdatePrescriptionInput) (*entity.Prescription, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	return uc.repo.Update(ctx, id, in)
}

func (uc *PrescriptionUsecase) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.repo.Delete(ctx, id)
}
