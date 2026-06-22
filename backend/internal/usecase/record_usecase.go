package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// RecordUsecase は服薬記録のビジネスロジック
type RecordUsecase struct {
	records     repository.MedicationRecordRepository
	medications repository.MedicationRepository
	members     repository.MemberRepository
}

func NewRecordUsecase(records repository.MedicationRecordRepository, medications repository.MedicationRepository, members repository.MemberRepository) *RecordUsecase {
	return &RecordUsecase{records: records, medications: medications, members: members}
}

func (uc *RecordUsecase) ListByUser(ctx context.Context, userID string) ([]entity.MedicationRecord, error) {
	return uc.records.ListByUser(ctx, userID)
}

// ListFiltered はメンバー/期間/件数で絞り込んで記録を返す。memberId指定時は所有権を確認する。
func (uc *RecordUsecase) ListFiltered(ctx context.Context, userID string, f repository.RecordFilter) ([]entity.MedicationRecord, error) {
	if f.MemberID != "" {
		if err := ensureMemberOwner(ctx, uc.members, userID, f.MemberID); err != nil {
			return nil, err
		}
	}
	return uc.records.ListByUserFiltered(ctx, userID, f)
}

func (uc *RecordUsecase) ListByMember(ctx context.Context, userID, memberID string) ([]entity.MedicationRecord, error) {
	if err := ensureMemberOwner(ctx, uc.members, userID, memberID); err != nil {
		return nil, err
	}
	return uc.records.ListByMember(ctx, memberID)
}

func (uc *RecordUsecase) Create(ctx context.Context, in repository.CreateRecordInput) (*entity.MedicationRecord, error) {
	med, err := uc.medications.FindByID(ctx, in.MedicationID)
	if err != nil {
		return nil, err
	}
	if med == nil {
		return nil, domain.NewNotFound("薬")
	}
	if med.UserID != in.UserID {
		return nil, domain.NewForbidden("この薬にアクセスする権限がありません")
	}
	in.MemberID = med.MemberID
	return uc.records.Create(ctx, in)
}

func (uc *RecordUsecase) Delete(ctx context.Context, userID, id string) error {
	rec, err := uc.records.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if rec == nil {
		return domain.NewNotFound("記録")
	}
	if rec.UserID != userID {
		return domain.NewForbidden("この記録にアクセスする権限がありません")
	}
	return uc.records.Delete(ctx, id)
}
