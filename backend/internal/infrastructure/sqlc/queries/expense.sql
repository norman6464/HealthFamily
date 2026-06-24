-- name: GetExpense :one
SELECT "id", "userId", "memberId", "category", "amount", "description", "expenseDate", "isDeductible", "createdAt"
FROM "Expense"
WHERE "id" = $1;
