package persistence

import (
	"context"
	"errors"
	"strconv"

	"github.com/jackc/pgx/v5"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/pkg/auth"
)

// ExpenseRepository は "Expense" テーブルの生SQL実装
type ExpenseRepository struct {
	db *database.DB
}

func NewExpenseRepository(db *database.DB) *ExpenseRepository {
	return &ExpenseRepository{db: db}
}

const expenseColumns = `"id", "userId", "memberId", "category", "amount", "description", "expenseDate", "isDeductible", "createdAt"`

func scanExpense(row pgx.Row) (*entity.Expense, error) {
	var e entity.Expense
	err := row.Scan(&e.ID, &e.UserID, &e.MemberID, &e.Category, &e.Amount,
		&e.Description, &e.ExpenseDate, &e.IsDeductible, &e.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &e, nil
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

	rows, err := r.db.Pool.Query(ctx, query, args...)
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
	row := r.db.Pool.QueryRow(ctx, `SELECT `+expenseColumns+` FROM "Expense" WHERE "id"=$1`, id)
	return scanExpense(row)
}

func (r *ExpenseRepository) Create(ctx context.Context, in repository.CreateExpenseInput) (*entity.Expense, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "Expense" ("id", "userId", "memberId", "category", "amount", "description", "expenseDate", "isDeductible", "createdAt")
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
		 RETURNING `+expenseColumns,
		id, in.UserID, in.MemberID, in.Category, in.Amount, in.Description, in.ExpenseDate, in.IsDeductible)
	return scanExpense(row)
}

func (r *ExpenseRepository) Update(ctx context.Context, id string, in repository.UpdateExpenseInput) (*entity.Expense, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE "Expense" SET
			"memberId" = COALESCE($2, "memberId"),
			"category" = COALESCE($3, "category"),
			"amount" = COALESCE($4, "amount"),
			"description" = COALESCE($5, "description"),
			"expenseDate" = COALESCE($6, "expenseDate"),
			"isDeductible" = COALESCE($7, "isDeductible")
		 WHERE "id"=$1
		 RETURNING `+expenseColumns,
		id, in.MemberID, in.Category, in.Amount, in.Description, in.ExpenseDate, in.IsDeductible)
	return scanExpense(row)
}

func (r *ExpenseRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM "Expense" WHERE "id"=$1`, id)
	return err
}

// Summary は指定年(JST基準)の合計・控除対象合計・カテゴリ別・月別を集計する。
func (r *ExpenseRepository) Summary(ctx context.Context, userID string, year int) (*entity.ExpenseSummary, error) {
	s := &entity.ExpenseSummary{Year: year, ByCategory: map[string]int{}, ByMonth: make([]entity.MonthlyTotal, 0)}

	// 合計・控除対象合計
	if err := r.db.Pool.QueryRow(ctx,
		`SELECT COALESCE(SUM("amount"),0),
			COALESCE(SUM("amount") FILTER (WHERE "isDeductible"),0)
		 FROM "Expense"
		 WHERE "userId"=$1 AND EXTRACT(YEAR FROM "expenseDate" AT TIME ZONE 'Asia/Tokyo')=$2`,
		userID, year).Scan(&s.Total, &s.DeductibleTotal); err != nil {
		return nil, err
	}

	// カテゴリ別
	catRows, err := r.db.Pool.Query(ctx,
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
	monRows, err := r.db.Pool.Query(ctx,
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
