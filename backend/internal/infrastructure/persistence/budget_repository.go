package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/sqlc/sqlcgen"
	"healthfamily/internal/pkg/auth"
)

// BudgetRepository は "Budget" / "CategoryBudget" テーブルのリポジトリ。
// 検索系(Get)は sqlc、書き込み系(Set/MarkAlerted)は GORM を使う。
type BudgetRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewBudgetRepository(db *database.DB) *BudgetRepository {
	return &BudgetRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func (r *BudgetRepository) loadCategories(ctx context.Context, userID string) ([]entity.CategoryBudget, error) {
	rows, err := r.q.ListCategoryBudgets(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.CategoryBudget, 0, len(rows))
	for _, c := range rows {
		list = append(list, entity.CategoryBudget{Category: c.Category, MonthlyAmount: int(c.MonthlyAmount)})
	}
	return list, nil
}

func (r *BudgetRepository) Get(ctx context.Context, userID string) (*entity.Budget, error) {
	row, err := r.q.GetBudgetByUserID(ctx, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	b := &entity.Budget{
		ID:               row.ID,
		UserID:           row.UserId,
		MonthlyAmount:    int(row.MonthlyAmount),
		AlertEnabled:     row.AlertEnabled,
		LastAlertedMonth: row.LastAlertedMonth,
		CreatedAt:        row.CreatedAt,
		UpdatedAt:        row.UpdatedAt,
	}
	cats, err := r.loadCategories(ctx, userID)
	if err != nil {
		return nil, err
	}
	b.Categories = cats
	return b, nil
}

func (r *BudgetRepository) Set(ctx context.Context, userID string, in repository.SetBudgetInput) (*entity.Budget, error) {
	err := r.gdb.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Budget は userId 単位の upsert
		rec := gormBudget{ID: auth.NewID(), UserID: userID, MonthlyAmount: in.MonthlyAmount, AlertEnabled: in.AlertEnabled}
		if err := tx.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "userId"}},
			DoUpdates: clause.Assignments(map[string]any{
				"monthlyAmount": in.MonthlyAmount,
				"alertEnabled":  in.AlertEnabled,
				"updatedAt":     gorm.Expr("now()"),
			}),
		}).Create(&rec).Error; err != nil {
			return err
		}
		// カテゴリ別予算は指定内容で置き換え
		if err := tx.Where(`"userId" = ?`, userID).Delete(&gormCategoryBudget{}).Error; err != nil {
			return err
		}
		for _, c := range in.Categories {
			if c.MonthlyAmount <= 0 {
				continue
			}
			cat := gormCategoryBudget{ID: auth.NewID(), UserID: userID, Category: c.Category, MonthlyAmount: c.MonthlyAmount}
			if err := tx.Create(&cat).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, userID)
}

func (r *BudgetRepository) MarkAlerted(ctx context.Context, userID, month string) error {
	return r.gdb.WithContext(ctx).Model(&gormBudget{}).Where(`"userId" = ?`, userID).
		Updates(map[string]any{"lastAlertedMonth": month, "updatedAt": gorm.Expr("now()")}).Error
}
