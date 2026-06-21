package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// EmergencyContactUsecase は緊急連絡先のビジネスロジック
type EmergencyContactUsecase struct {
	repo    repository.EmergencyContactRepository
	members repository.MemberRepository
}

func NewEmergencyContactUsecase(repo repository.EmergencyContactRepository, members repository.MemberRepository) *EmergencyContactUsecase {
	return &EmergencyContactUsecase{repo: repo, members: members}
}

func (uc *EmergencyContactUsecase) ensureOwner(ctx context.Context, userID, id string) (*entity.EmergencyContact, error) {
	e, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if e == nil {
		return nil, domain.NewNotFound("緊急連絡先")
	}
	if e.UserID != userID {
		return nil, domain.NewForbidden("この緊急連絡先にアクセスする権限がありません")
	}
	return e, nil
}

func (uc *EmergencyContactUsecase) List(ctx context.Context, userID string) ([]entity.EmergencyContact, error) {
	return uc.repo.List(ctx, userID)
}

func (uc *EmergencyContactUsecase) Get(ctx context.Context, userID, id string) (*entity.EmergencyContact, error) {
	return uc.ensureOwner(ctx, userID, id)
}

func (uc *EmergencyContactUsecase) Create(ctx context.Context, in repository.CreateEmergencyContactInput) (*entity.EmergencyContact, error) {
	if err := ensureMemberOwner(ctx, uc.members, in.UserID, in.MemberID); err != nil {
		return nil, err
	}
	return uc.repo.Create(ctx, in)
}

func (uc *EmergencyContactUsecase) Update(ctx context.Context, userID, id string, in repository.UpdateEmergencyContactInput) (*entity.EmergencyContact, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	return uc.repo.Update(ctx, id, in)
}

func (uc *EmergencyContactUsecase) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.repo.Delete(ctx, id)
}
