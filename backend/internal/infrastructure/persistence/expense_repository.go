package persistence

import (
	"context"
	"errors"
	"strconv"

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
	query := `SELECT ` + expenseColumns + ` FROM "Expense" WHERE "userId"=$1`
	args := []any{userID}
	n := 1
	if f.MemberID != "" {
		n++
		query += ` AND "memberId"=$` + strconv.Itoa(n)
		args = append(args, f.MemberID)
	}
	if f.Year > 0 {
		n++
		query += ` AND EXTRACT(YEAR FROM "expenseDate" AT TIME ZONE 'Asia/Tokyo') = $` + strconv.Itoa(n)
		args = append(args, f.Year)
	}
	query += ` ORDER BY "expenseDate" DESC`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.Expense, 0)
	for rows.Next() {
		var e entity.Expense
		if err := rows.Scan(&e.ID, &e.UserID, &e.MemberID, &e.Category, &e.Amount,
			&e.Description, &e.ExpenseDate, &e.IsDeductible, &e.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, rows.Err()
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
// 集計のため生SQL(pgx)を維持する。
func (r *ExpenseRepository) Summary(ctx context.Context, userID string, year int) (*entity.ExpenseSummary, error) {
	s := &entity.ExpenseSummary{Year: year, ByCategory: map[string]int{}, ByMonth: make([]entity.MonthlyTotal, 0)}

	// 合計・控除対象合計
	if err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(SUM("amount"),0),
			COALESCE(SUM("amount") FILTER (WHERE "isDeductible"),0)
		 FROM "Expense"
		 WHERE "userId"=$1 AND EXTRACT(YEAR FROM "expenseDate" AT TIME ZONE 'Asia/Tokyo')=$2`,
		userID, year).Scan(&s.Total, &s.DeductibleTotal); err != nil {
		return nil, err
	}

	// カテゴリ別
	catRows, err := r.pool.Query(ctx,
		`SELECT "category", SUM("amount") FROM "Expense"
		 WHERE "userId"=$1 AND EXTRACT(YEAR FROM "expenseDate" AT TIME ZONE 'Asia/Tokyo')=$2
		 GROUP BY "category"`, userID, year)
	if err != nil {
		return nil, err
	}
	defer catRows.Close()
	for catRows.Next() {
		var cat string
		var sum int
		if err := catRows.Scan(&cat, &sum); err != nil {
			return nil, err
		}
		s.ByCategory[cat] = sum
	}
	if err := catRows.Err(); err != nil {
		return nil, err
	}

	// 月別
	monRows, err := r.pool.Query(ctx,
		`SELECT EXTRACT(MONTH FROM "expenseDate" AT TIME ZONE 'Asia/Tokyo')::int AS m, SUM("amount")
		 FROM "Expense"
		 WHERE "userId"=$1 AND EXTRACT(YEAR FROM "expenseDate" AT TIME ZONE 'Asia/Tokyo')=$2
		 GROUP BY m ORDER BY m`, userID, year)
	if err != nil {
		return nil, err
	}
	defer monRows.Close()
	for monRows.Next() {
		var mt entity.MonthlyTotal
		if err := monRows.Scan(&mt.Month, &mt.Total); err != nil {
			return nil, err
		}
		s.ByMonth = append(s.ByMonth, mt)
	}
	return s, monRows.Err()
}
