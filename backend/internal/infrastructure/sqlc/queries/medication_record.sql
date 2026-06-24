-- name: ListMedicationRecordsByUser :many
SELECT "id", "memberId", "medicationId", "userId", "scheduleId", "takenAt", "notes", "dosageAmount"
FROM "MedicationRecord"
WHERE "userId" = $1
ORDER BY "takenAt" DESC;

-- name: ListMedicationRecordsByMember :many
SELECT "id", "memberId", "medicationId", "userId", "scheduleId", "takenAt", "notes", "dosageAmount"
FROM "MedicationRecord"
WHERE "memberId" = $1
ORDER BY "takenAt" DESC;

-- name: GetMedicationRecord :one
SELECT "id", "memberId", "medicationId", "userId", "scheduleId", "takenAt", "notes", "dosageAmount"
FROM "MedicationRecord"
WHERE "id" = $1;
