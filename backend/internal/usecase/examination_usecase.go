package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// ExaminationUsecase は検査のビジネスロジック
type ExaminationUsecase struct {
	repo    repository.ExaminationRepository
	members repository.MemberRepository
}

func NewExaminationUsecase(repo repository.ExaminationRepository, members repository.MemberRepository) *ExaminationUsecase {
	return &ExaminationUsecase{repo: repo, members: members}
}

func (uc *ExaminationUsecase) ensureOwner(ctx context.Context, userID, id string) (*entity.Examination, error) {
	e, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if e == nil {
		return nil, domain.NewNotFound("検査")
	}
	if e.UserID != userID {
		return nil, domain.NewForbidden("この検査にアクセスする権限がありません")
	}
	return e, nil
}

func (uc *ExaminationUsecase) List(ctx context.Context, userID string) ([]entity.Examination, error) {
	return uc.repo.List(ctx, userID)
}

func (uc *ExaminationUsecase) Get(ctx context.Context, userID, id string) (*entity.Examination, error) {
	return uc.ensureOwner(ctx, userID, id)
}

func (uc *ExaminationUsecase) Create(ctx context.Context, in repository.CreateExaminationInput) (*entity.Examination, error) {
	if err := ensureMemberOwner(ctx, uc.members, in.UserID, in.MemberID); err != nil {
		return nil, err
	}
	return uc.repo.Create(ctx, in)
}

func (uc *ExaminationUsecase) Update(ctx context.Context, userID, id string, in repository.UpdateExaminationInput) (*entity.Examination, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	return uc.repo.Update(ctx, id, in)
}

func (uc *ExaminationUsecase) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.repo.Delete(ctx, id)
}
