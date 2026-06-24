-- name: ListTemperatureRecords :many
SELECT "id", "userId", "memberId", "temperature", "measuredAt", "notes", "createdAt"
FROM "TemperatureRecord"
WHERE "userId" = $1
ORDER BY "measuredAt" DESC;

-- name: ListTemperatureRecordsByMember :many
SELECT "id", "userId", "memberId", "temperature", "measuredAt", "notes", "createdAt"
FROM "TemperatureRecord"
WHERE "memberId" = $1
ORDER BY "measuredAt" DESC;

-- name: GetTemperatureRecord :one
SELECT "id", "userId", "memberId", "temperature", "measuredAt", "notes", "createdAt"
FROM "TemperatureRecord"
WHERE "id" = $1;
