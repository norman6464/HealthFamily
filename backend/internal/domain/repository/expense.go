package repository

import (
	"context"
	"time"

	"healthfamily/internal/domain/entity"
)

// ExpenseFilter は支出一覧の絞り込み条件
type ExpenseFilter struct {
	MemberID string // 空なら全メンバー（世帯全体）
	Year     int    // 0なら全期間
}

// CreateExpenseInput は支出作成入力
type CreateExpenseInput struct {
	UserID       string
	MemberID     *string
	Category     string
	Amount       int
	Description  *string
	ExpenseDate  time.Time
	IsDeductible bool
}

// UpdateExpenseInput は支出更新入力（nilは未変更）
type UpdateExpenseInput struct {
	MemberID     *string
	Category     *string
	Amount       *int
	Description  *string
	ExpenseDate  *time.Time
	IsDeductible *bool
}

// ExpenseRepository は医療費・健康支出永続化の抽象
type ExpenseRepository interface {
	List(ctx context.Context, userID string, f ExpenseFilter) ([]entity.Expense, error)
	FindByID(ctx context.Context, id string) (*entity.Expense, error)
	Create(ctx context.Context, in CreateExpenseInput) (*entity.Expense, error)
	Update(ctx context.Context, id string, in UpdateExpenseInput) (*entity.Expense, error)
	Delete(ctx context.Context, id string) error
	Summary(ctx context.Context, userID string, year int) (*entity.ExpenseSummary, error)
}
