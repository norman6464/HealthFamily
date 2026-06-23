package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// PrescriptionUsecase は処方箋のビジネスロジック
type PrescriptionUsecase struct {
	repo        repository.PrescriptionRepository
	members     repository.MemberRepository
	medications repository.MedicationRepository
}

func NewPrescriptionUsecase(repo repository.PrescriptionRepository, members repository.MemberRepository, medications repository.MedicationRepository) *PrescriptionUsecase {
	return &PrescriptionUsecase{repo: repo, members: members, medications: medications}
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

// SetItems は処方明細(行データ)を置き換える。
func (uc *PrescriptionUsecase) SetItems(ctx context.Context, userID, id string, items []entity.PrescriptionItem) (*entity.Prescription, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	for _, it := range items {
		if it.Name == "" {
			return nil, domain.NewValidation("薬の名前は必須です")
		}
	}
	if err := uc.repo.ReplaceItems(ctx, id, items); err != nil {
		return nil, err
	}
	return uc.repo.FindByID(ctx, id)
}

// Dispense は処方明細から服薬管理(Medication)を一括作成する(電子処方箋→調剤の橋渡し)。
func (uc *PrescriptionUsecase) Dispense(ctx context.Context, userID, id string) ([]entity.Medication, error) {
	p, err := uc.ensureOwner(ctx, userID, id)
	if err != nil {
		return nil, err
	}
	if len(p.Items) == 0 {
		return nil, domain.NewValidation("処方明細がありません")
	}
	created := make([]entity.Medication, 0, len(p.Items))
	for _, it := range p.Items {
		m, err := uc.medications.Create(ctx, repository.CreateMedicationInput{
			UserID:       userID,
			MemberID:     p.MemberID,
			Name:         it.Name,
			Category:     "regular",
			DosageAmount: it.Dosage,
			Frequency:    it.Frequency,
		})
		if err != nil {
			return nil, err
		}
		created = append(created, *m)
	}
	return created, nil
}
