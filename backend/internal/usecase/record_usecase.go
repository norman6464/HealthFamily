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

func (uc *RecordUsecase) ListByMember(ctx context.Context, userID, memberID string) ([]entity.MedicationRecord, error) {
	m, err := uc.members.FindByID(ctx, memberID)
	if err != nil {
		return nil, err
	}
	if m == nil {
		return nil, domain.NewNotFound("メンバー")
	}
	if m.UserID != userID {
		return nil, domain.NewForbidden("このメンバーにアクセスする権限がありません")
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
