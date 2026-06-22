package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// MemberUsecase はメンバー管理のビジネスロジック
type MemberUsecase struct {
	members repository.MemberRepository
}

func NewMemberUsecase(members repository.MemberRepository) *MemberUsecase {
	return &MemberUsecase{members: members}
}

// ensureOwner は指定メンバーが userID の所有であることを確認する
func (uc *MemberUsecase) ensureOwner(ctx context.Context, userID, memberID string) (*entity.Member, error) {
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
	return m, nil
}

func (uc *MemberUsecase) List(ctx context.Context, userID string) ([]entity.Member, error) {
	return uc.members.List(ctx, userID)
}

// ListSummary はメンバー＋薬数の集計を返す（N+1回避）
func (uc *MemberUsecase) ListSummary(ctx context.Context, userID string) ([]entity.MemberSummary, error) {
	return uc.members.ListSummary(ctx, userID)
}

func (uc *MemberUsecase) Get(ctx context.Context, userID, memberID string) (*entity.Member, error) {
	return uc.ensureOwner(ctx, userID, memberID)
}

func (uc *MemberUsecase) Create(ctx context.Context, in repository.CreateMemberInput) (*entity.Member, error) {
	if in.MemberType == "" {
		in.MemberType = "human"
	}
	return uc.members.Create(ctx, in)
}

func (uc *MemberUsecase) Update(ctx context.Context, userID, memberID string, in repository.UpdateMemberInput) (*entity.Member, error) {
	if _, err := uc.ensureOwner(ctx, userID, memberID); err != nil {
		return nil, err
	}
	return uc.members.Update(ctx, memberID, in)
}

func (uc *MemberUsecase) Delete(ctx context.Context, userID, memberID string) error {
	if _, err := uc.ensureOwner(ctx, userID, memberID); err != nil {
		return err
	}
	return uc.members.Delete(ctx, memberID)
}
