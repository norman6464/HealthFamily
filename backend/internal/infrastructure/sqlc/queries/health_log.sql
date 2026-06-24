-- name: ListHealthLogs :many
SELECT "id", "memberId", "userId", "conditionLevel", "symptoms", "notes", "recordedAt"
FROM "HealthLog"
WHERE "userId" = $1
ORDER BY "recordedAt" DESC;

-- name: GetHealthLog :one
SELECT "id", "memberId", "userId", "conditionLevel", "symptoms", "notes", "recordedAt"
FROM "HealthLog"
WHERE "id" = $1;
