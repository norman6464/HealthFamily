package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// HospitalUsecase は病院管理のビジネスロジック（user スコープ）
type HospitalUsecase struct {
	hospitals repository.HospitalRepository
}

func NewHospitalUsecase(hospitals repository.HospitalRepository) *HospitalUsecase {
	return &HospitalUsecase{hospitals: hospitals}
}

func (uc *HospitalUsecase) ensureOwner(ctx context.Context, userID, id string) (*entity.Hospital, error) {
	h, err := uc.hospitals.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if h == nil {
		return nil, domain.NewNotFound("病院")
	}
	if h.UserID != userID {
		return nil, domain.NewForbidden("この病院にアクセスする権限がありません")
	}
	return h, nil
}

func (uc *HospitalUsecase) List(ctx context.Context, userID string) ([]entity.Hospital, error) {
	return uc.hospitals.List(ctx, userID)
}

func (uc *HospitalUsecase) Get(ctx context.Context, userID, id string) (*entity.Hospital, error) {
	return uc.ensureOwner(ctx, userID, id)
}

func (uc *HospitalUsecase) Create(ctx context.Context, in repository.CreateHospitalInput) (*entity.Hospital, error) {
	return uc.hospitals.Create(ctx, in)
}

func (uc *HospitalUsecase) Update(ctx context.Context, userID, id string, in repository.UpdateHospitalInput) (*entity.Hospital, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	return uc.hospitals.Update(ctx, id, in)
}

func (uc *HospitalUsecase) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.hospitals.Delete(ctx, id)
}
