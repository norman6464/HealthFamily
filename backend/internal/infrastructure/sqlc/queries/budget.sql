-- name: GetBudgetByUserID :one
SELECT "id", "userId", "monthlyAmount", "alertEnabled", "lastAlertedMonth", "createdAt", "updatedAt"
FROM "Budget"
WHERE "userId" = $1;

-- name: ListCategoryBudgets :many
SELECT "category", "monthlyAmount"
FROM "CategoryBudget"
WHERE "userId" = $1
ORDER BY "category";
