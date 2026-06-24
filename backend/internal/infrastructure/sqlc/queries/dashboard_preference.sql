-- name: GetDashboardPreference :one
SELECT "userId", "hiddenCards", "cardOrder", "defaultMemberId"
FROM "DashboardPreference"
WHERE "userId" = $1;
