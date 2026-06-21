package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/repository"
)

// ensureMemberOwner は指定メンバーが userID の所有であることを確認する共通ヘルパー
func ensureMemberOwner(ctx context.Context, members repository.MemberRepository, userID, memberID string) error {
	m, err := members.FindByID(ctx, memberID)
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
