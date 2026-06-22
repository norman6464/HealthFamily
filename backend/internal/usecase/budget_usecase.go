package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// BudgetUsecase は月次予算（パーソナライズ）のビジネスロジック
type BudgetUsecase struct {
	budgets repository.BudgetRepository
}

func NewBudgetUsecase(budgets repository.BudgetRepository) *BudgetUsecase {
	return &BudgetUsecase{budgets: budgets}
}

// Get は予算を返す。未設定なら monthlyAmount=0 のデフォルトを返す。
func (uc *BudgetUsecase) Get(ctx context.Context, userID string) (*entity.Budget, error) {
	b, err := uc.budgets.Get(ctx, userID)
	if err != nil {
		return nil, err
	}
	if b == nil {
		return &entity.Budget{UserID: userID, MonthlyAmount: 0}, nil
	}
	return b, nil
}

// Set は予算を保存する。不正な金額(負数)は保存させない。
func (uc *BudgetUsecase) Set(ctx context.Context, userID string, monthlyAmount int) (*entity.Budget, error) {
	if monthlyAmount < 0 {
		return nil, domain.NewValidation("予算は0円以上で入力してください")
	}
	return uc.budgets.Upsert(ctx, userID, monthlyAmount)
}
