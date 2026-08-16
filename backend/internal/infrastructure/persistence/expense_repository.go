package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"gorm.io/gorm"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/sqlc/sqlcgen"
	"healthfamily/internal/pkg/auth"
)

// expenseColumns は動的フィルタ一覧(List)で利用する列一覧。
const expenseColumns = `"id", "userId", "memberId", "category", "amount", "description", "expenseDate", "isDeductible", "createdAt"`

// ExpenseRepository は "Expense" テーブルのリポジトリ。
// 静的検索(FindByID)は sqlc、書き込み(Create/Update/Delete)は GORM。
// 動的フィルタ(List)・集計(Summary)は生SQL(pgx)を pool で維持する。
type ExpenseRepository struct {
	gdb  *gorm.DB
	q    *sqlcgen.Queries
	pool *pgxpool.Pool
}

func NewExpenseRepository(db *database.DB) *ExpenseRepository {
	return &ExpenseRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool), pool: db.Pool}
}

func expenseFromSqlc(e sqlcgen.Expense) entity.Expense {
	return entity.Expense{
		ID:           e.ID,
		UserID:       e.UserId,
		MemberID:     e.MemberId,
		Category:     e.Category,
		Amount:       int(e.Amount),
		Description:  e.Description,
		ExpenseDate:  e.ExpenseDate,
		IsDeductible: e.IsDeductible,
		CreatedAt:    e.CreatedAt,
	}
}

func (r *ExpenseRepository) List(ctx context.Context, userID string, f repository.ExpenseFilter) ([]entity.Expense, error) {
	params := sqlcgen.ListExpensesFilteredParams{UserID: userID}
	if f.MemberID != "" {
		params.MemberID = &f.MemberID
	}
	if f.Year > 0 {
		year := int32(f.Year)
		params.Year = &year
	}

	rows, err := r.q.ListExpensesFiltered(ctx, params)
	if err != nil {
		return nil, err
	}
	list := make([]entity.Expense, 0, len(rows))
	for _, row := range rows {
		list = append(list, expenseFromSqlc(row))
	}
	return list, nil
}

func (r *ExpenseRepository) FindByID(ctx context.Context, id string) (*entity.Expense, error) {
	e, err := r.q.GetExpense(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	ent := expenseFromSqlc(e)
	return &ent, nil
}

func (r *ExpenseRepository) Create(ctx context.Context, in repository.CreateExpenseInput) (*entity.Expense, error) {
	m := gormExpense{
		ID:           auth.NewID(),
		UserID:       in.UserID,
		MemberID:     in.MemberID,
		Category:     in.Category,
		Amount:       in.Amount,
		Description:  in.Description,
		ExpenseDate:  in.ExpenseDate,
		IsDeductible: in.IsDeductible,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *ExpenseRepository) Update(ctx context.Context, id string, in repository.UpdateExpenseInput) (*entity.Expense, error) {
	fields := map[string]any{}
	if in.MemberID != nil {
		fields["memberId"] = *in.MemberID
	}
	if in.Category != nil {
		fields["category"] = *in.Category
	}
	if in.Amount != nil {
		fields["amount"] = *in.Amount
	}
	if in.Description != nil {
		fields["description"] = *in.Description
	}
	if in.ExpenseDate != nil {
		fields["expenseDate"] = *in.ExpenseDate
	}
	if in.IsDeductible != nil {
		fields["isDeductible"] = *in.IsDeductible
	}
	if len(fields) > 0 {
		if err := r.gdb.WithContext(ctx).Model(&gormExpense{}).
			Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(ctx, id)
}

func (r *ExpenseRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormExpense{}).Error
}

// Summary は指定年(JST基準)の合計・控除対象合計・カテゴリ別・月別を集計する。
func (r *ExpenseRepository) Summary(ctx context.Context, userID string, year int) (*entity.ExpenseSummary, error) {
	s := &entity.ExpenseSummary{Year: year, ByCategory: map[string]int{}, ByMonth: make([]entity.MonthlyTotal, 0)}
	y := int32(year)

	totals, err := r.q.SumExpensesByYear(ctx, sqlcgen.SumExpensesByYearParams{UserID: userID, Year: y})
	if err != nil {
		return nil, err
	}
	s.Total = int(totals.Total)
	s.DeductibleTotal = int(totals.DeductibleTotal)

	cats, err := r.q.SumExpensesByCategory(ctx, sqlcgen.SumExpensesByCategoryParams{UserID: userID, Year: y})
	if err != nil {
		return nil, err
	}
	for _, c := range cats {
		s.ByCategory[c.Category] = int(c.Total)
	}

	months, err := r.q.SumExpensesByMonth(ctx, sqlcgen.SumExpensesByMonthParams{UserID: userID, Year: y})
	if err != nil {
		return nil, err
	}
	for _, m := range months {
		s.ByMonth = append(s.ByMonth, entity.MonthlyTotal{Month: int(m.Month), Total: int(m.Total)})
	}
	return s, nil
}
