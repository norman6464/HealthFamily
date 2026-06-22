package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/pkg/auth"
)

// BudgetRepository は "Budget" / "CategoryBudget" テーブルの生SQL実装
type BudgetRepository struct {
	db *database.DB
}

func NewBudgetRepository(db *database.DB) *BudgetRepository {
	return &BudgetRepository{db: db}
}

const budgetColumns = `"id", "userId", "monthlyAmount", "alertEnabled", "lastAlertedMonth", "createdAt", "updatedAt"`

func scanBudget(row pgx.Row) (*entity.Budget, error) {
	var b entity.Budget
	err := row.Scan(&b.ID, &b.UserID, &b.MonthlyAmount, &b.AlertEnabled, &b.LastAlertedMonth, &b.CreatedAt, &b.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BudgetRepository) loadCategories(ctx context.Context, userID string) ([]entity.CategoryBudget, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT "category", "monthlyAmount" FROM "CategoryBudget" WHERE "userId"=$1 ORDER BY "category"`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.CategoryBudget, 0)
	for rows.Next() {
		var c entity.CategoryBudget
		if err := rows.Scan(&c.Category, &c.MonthlyAmount); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, rows.Err()
}

func (r *BudgetRepository) Get(ctx context.Context, userID string) (*entity.Budget, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+budgetColumns+` FROM "Budget" WHERE "userId"=$1`, userID)
	b, err := scanBudget(row)
	if err != nil || b == nil {
		return b, err
	}
	cats, err := r.loadCategories(ctx, userID)
	if err != nil {
		return nil, err
	}
	b.Categories = cats
	return b, nil
}

func (r *BudgetRepository) Set(ctx context.Context, userID string, in repository.SetBudgetInput) (*entity.Budget, error) {
	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	id := auth.NewID()
	row := tx.QueryRow(ctx,
		`INSERT INTO "Budget" ("id", "userId", "monthlyAmount", "alertEnabled", "createdAt", "updatedAt")
		 VALUES ($1, $2, $3, $4, now(), now())
		 ON CONFLICT ("userId") DO UPDATE
		   SET "monthlyAmount" = EXCLUDED."monthlyAmount",
		       "alertEnabled" = EXCLUDED."alertEnabled",
		       "updatedAt" = now()
		 RETURNING `+budgetColumns,
		id, userID, in.MonthlyAmount, in.AlertEnabled)
	b, err := scanBudget(row)
	if err != nil {
		return nil, err
	}

	// カテゴリ別予算は指定内容で置き換え
	if _, err := tx.Exec(ctx, `DELETE FROM "CategoryBudget" WHERE "userId"=$1`, userID); err != nil {
		return nil, err
	}
	for _, c := range in.Categories {
		if c.MonthlyAmount <= 0 {
			continue
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO "CategoryBudget" ("id", "userId", "category", "monthlyAmount", "createdAt", "updatedAt")
			 VALUES ($1,$2,$3,$4, now(), now())`,
			auth.NewID(), userID, c.Category, c.MonthlyAmount); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	b.Categories, err = r.loadCategories(ctx, userID)
	return b, err
}

func (r *BudgetRepository) MarkAlerted(ctx context.Context, userID, month string) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE "Budget" SET "lastAlertedMonth"=$2, "updatedAt"=now() WHERE "userId"=$1`, userID, month)
	return err
}
