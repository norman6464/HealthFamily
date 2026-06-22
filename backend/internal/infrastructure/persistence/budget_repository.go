package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/pkg/auth"
)

// BudgetRepository は "Budget" テーブルの生SQL実装（ユーザー単位の単一行）
type BudgetRepository struct {
	db *database.DB
}

func NewBudgetRepository(db *database.DB) *BudgetRepository {
	return &BudgetRepository{db: db}
}

const budgetColumns = `"id", "userId", "monthlyAmount", "createdAt", "updatedAt"`

func scanBudget(row pgx.Row) (*entity.Budget, error) {
	var b entity.Budget
	err := row.Scan(&b.ID, &b.UserID, &b.MonthlyAmount, &b.CreatedAt, &b.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BudgetRepository) Get(ctx context.Context, userID string) (*entity.Budget, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+budgetColumns+` FROM "Budget" WHERE "userId"=$1`, userID)
	return scanBudget(row)
}

func (r *BudgetRepository) Upsert(ctx context.Context, userID string, monthlyAmount int) (*entity.Budget, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "Budget" ("id", "userId", "monthlyAmount", "createdAt", "updatedAt")
		 VALUES ($1, $2, $3, now(), now())
		 ON CONFLICT ("userId") DO UPDATE
		   SET "monthlyAmount" = EXCLUDED."monthlyAmount", "updatedAt" = now()
		 RETURNING `+budgetColumns,
		id, userID, monthlyAmount)
	return scanBudget(row)
}
