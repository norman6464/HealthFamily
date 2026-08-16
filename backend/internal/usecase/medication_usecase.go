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
	if err := ensureMemberOwner(ctx, uc.members, userID, memberID); err != nil {
		return nil, err
	}
	return uc.medications.ListByMember(ctx, memberID)
}

func (uc *MedicationUsecase) ListByUser(ctx context.Context, userID string) ([]entity.Medication, error) {
	return uc.medications.ListByUser(ctx, userID)
}

// ListAlerts は在庫僅少の薬を返す
func (uc *MedicationUsecase) ListAlerts(ctx context.Context, userID string) ([]entity.Medication, error) {
	return uc.medications.ListAlerts(ctx, userID)
}

func (uc *MedicationUsecase) Get(ctx context.Context, userID, medID string) (*entity.Medication, error) {
	return uc.ensureMedOwner(ctx, userID, medID)
}

func (uc *MedicationUsecase) Create(ctx context.Context, in repository.CreateMedicationInput) (*entity.Medication, error) {
	if err := ensureMemberOwner(ctx, uc.members, in.UserID, in.MemberID); err != nil {
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

// Reorder は薬の表示順を入れ替える。
//
// 指定された ID がすべて自分の薬であることを、並び替える前に確認する。
// 以前はリポジトリの WHERE 句に頼っており、他人の ID や存在しない ID を
// 混ぜても黙って無視されて 200 を返していた。呼び出し側は成功したと誤認するし、
// 応答が変わらないことを利用して ID の当たり判定にも使えてしまう。
func (uc *MedicationUsecase) Reorder(ctx context.Context, userID string, orderedIDs []string) error {
	seen := make(map[string]struct{}, len(orderedIDs))
	for _, id := range orderedIDs {
		if _, dup := seen[id]; dup {
			// 重複があると並び順が一意に定まらない
			return domain.NewValidation("並び順に同じ薬が重複しています")
		}
		seen[id] = struct{}{}

		if _, err := uc.ensureMedOwner(ctx, userID, id); err != nil {
			return err
		}
	}
	return uc.medications.Reorder(ctx, userID, orderedIDs)
}

func (uc *MedicationUsecase) Delete(ctx context.Context, userID, medID string) error {
	if _, err := uc.ensureMedOwner(ctx, userID, medID); err != nil {
		return err
	}
	return uc.medications.Delete(ctx, medID)
}
