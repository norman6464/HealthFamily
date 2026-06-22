package repository

import (
	"context"

	"healthfamily/internal/domain/entity"
)

// SetBudgetInput は予算保存入力（カテゴリ別はこの内容で置き換え）
type SetBudgetInput struct {
	MonthlyAmount int
	AlertEnabled  bool
	Categories    []entity.CategoryBudget
}

// BudgetRepository は月次予算（ユーザー単位、カテゴリ別含む）永続化の抽象
type BudgetRepository interface {
	Get(ctx context.Context, userID string) (*entity.Budget, error) // categories を含む。未設定なら nil
	Set(ctx context.Context, userID string, in SetBudgetInput) (*entity.Budget, error)
	MarkAlerted(ctx context.Context, userID, month string) error
}

// DashboardPreferenceRepository はダッシュボード設定（ユーザー単位）永続化の抽象
type DashboardPreferenceRepository interface {
	Get(ctx context.Context, userID string) (*entity.DashboardPreference, error) // 未設定なら nil
	Upsert(ctx context.Context, userID string, hiddenCards, cardOrder []string, defaultMemberID *string) (*entity.DashboardPreference, error)
}
