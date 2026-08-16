-- name: GetExpense :one
SELECT "id", "userId", "memberId", "category", "amount", "description", "expenseDate", "isDeductible", "createdAt"
FROM "Expense"
WHERE "id" = $1;

-- name: ListExpensesFiltered :many
-- 任意の絞り込み(メンバー/年)で医療費を返す。NULL を渡した条件は無視される。
-- 年は JST 基準。UTC で切ると、元日や大晦日の記録が前後の年に混ざる。
SELECT "id", "userId", "memberId", "category", "amount", "description",
       "expenseDate", "isDeductible", "createdAt"
FROM "Expense"
WHERE "userId" = sqlc.arg(user_id)
  AND (sqlc.narg(member_id)::text IS NULL OR "memberId" = sqlc.narg(member_id)::text)
  AND (sqlc.narg(year)::int IS NULL
       OR EXTRACT(YEAR FROM "expenseDate" AT TIME ZONE 'Asia/Tokyo') = sqlc.narg(year)::int)
ORDER BY "expenseDate" DESC;

-- name: SumExpensesByYear :one
SELECT COALESCE(SUM("amount"), 0)::bigint AS total,
       COALESCE(SUM("amount") FILTER (WHERE "isDeductible"), 0)::bigint AS deductible_total
FROM "Expense"
WHERE "userId" = sqlc.arg(user_id)
  AND EXTRACT(YEAR FROM "expenseDate" AT TIME ZONE 'Asia/Tokyo') = sqlc.arg(year)::int;

-- name: SumExpensesByCategory :many
SELECT "category", SUM("amount")::bigint AS total
FROM "Expense"
WHERE "userId" = sqlc.arg(user_id)
  AND EXTRACT(YEAR FROM "expenseDate" AT TIME ZONE 'Asia/Tokyo') = sqlc.arg(year)::int
GROUP BY "category";

-- name: SumExpensesByMonth :many
SELECT EXTRACT(MONTH FROM "expenseDate" AT TIME ZONE 'Asia/Tokyo')::int AS month,
       SUM("amount")::bigint AS total
FROM "Expense"
WHERE "userId" = sqlc.arg(user_id)
  AND EXTRACT(YEAR FROM "expenseDate" AT TIME ZONE 'Asia/Tokyo') = sqlc.arg(year)::int
GROUP BY month
ORDER BY month;
