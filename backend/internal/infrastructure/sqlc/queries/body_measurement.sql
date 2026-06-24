-- name: ListBodyMeasurements :many
SELECT "id", "userId", "memberId", "weight", "height", "recordedAt", "notes", "createdAt"
FROM "BodyMeasurement"
WHERE "userId" = $1
ORDER BY "recordedAt" DESC;

-- name: GetBodyMeasurement :one
SELECT "id", "userId", "memberId", "weight", "height", "recordedAt", "notes", "createdAt"
FROM "BodyMeasurement"
WHERE "id" = $1;
