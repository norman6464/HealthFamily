package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// MedicationUsecase は薬管理のビジネスロジック
type MedicationUsecase struct {
	medications repository.MedicationRepository
	members     repository.MemberRepository
}

func NewMedicationUsecase(medications repository.MedicationRepository, members repository.MemberRepository) *MedicationUsecase {
	return &MedicationUsecase{medications: medications, members: members}
}

func (uc *MedicationUsecase) ensureMemberOwner(ctx context.Context, userID, memberID string) error {
	m, err := uc.members.FindByID(ctx, memberID)
	if err != nil {
		return err
	}
	if m == nil {
		return domain.NewNotFound("メンバー")
	}
	if m.UserID != userID {
		return domain.NewForbidden("このメンバーにアクセスする権限がありません")
	}
	return nil
}

func (uc *MedicationUsecase) ensureMedOwner(ctx context.Context, userID, medID string) (*entity.Medication, error) {
	m, err := uc.medications.FindByID(ctx, medID)
	if err != nil {
		return nil, err
	}
	if m == nil {
		return nil, domain.NewNotFound("薬")
	}
	if m.UserID != userID {
		return nil, domain.NewForbidden("この薬にアクセスする権限がありません")
	}
	return m, nil
}

func (uc *MedicationUsecase) ListByMember(ctx context.Context, userID, memberID string) ([]entity.Medication, error) {
	if err := uc.ensureMemberOwner(ctx, userID, memberID); err != nil {
		return nil, err
	}
	return uc.medications.ListByMember(ctx, memberID)
}

func (uc *MedicationUsecase) ListByUser(ctx context.Context, userID string) ([]entity.Medication, error) {
	return uc.medications.ListByUser(ctx, userID)
}

func (uc *MedicationUsecase) Get(ctx context.Context, userID, medID string) (*entity.Medication, error) {
	return uc.ensureMedOwner(ctx, userID, medID)
}

func (uc *MedicationUsecase) Create(ctx context.Context, in repository.CreateMedicationInput) (*entity.Medication, error) {
	if err := uc.ensureMemberOwner(ctx, in.UserID, in.MemberID); err != nil {
		return nil, err
	}
	if in.Category == "" {
		in.Category = "regular"
	}
	return uc.medications.Create(ctx, in)
}

func (uc *MedicationUsecase) Update(ctx context.Context, userID, medID string, in repository.UpdateMedicationInput) (*entity.Medication, error) {
	if _, err := uc.ensureMedOwner(ctx, userID, medID); err != nil {
		return nil, err
	}
	return uc.medications.Update(ctx, medID, in)
}

func (uc *MedicationUsecase) UpdateStock(ctx context.Context, userID, medID string, quantity int) (*entity.Medication, error) {
	if _, err := uc.ensureMedOwner(ctx, userID, medID); err != nil {
		return nil, err
	}
	return uc.medications.UpdateStock(ctx, medID, quantity)
}

func (uc *MedicationUsecase) Reorder(ctx context.Context, userID string, orderedIDs []string) error {
	return uc.medications.Reorder(ctx, userID, orderedIDs)
}

func (uc *MedicationUsecase) Delete(ctx context.Context, userID, medID string) error {
	if _, err := uc.ensureMedOwner(ctx, userID, medID); err != nil {
		return err
	}
	return uc.medications.Delete(ctx, medID)
}
