package repository

import (
	"context"

	"healthfamily/internal/domain/entity"
)

// BudgetRepository は月次予算（ユーザー単位）永続化の抽象
type BudgetRepository interface {
	Get(ctx context.Context, userID string) (*entity.Budget, error) // 未設定なら nil
	Upsert(ctx context.Context, userID string, monthlyAmount int) (*entity.Budget, error)
}
