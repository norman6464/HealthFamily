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

-- name: ListRecordsByUserFiltered :many
-- 任意の絞り込み(メンバー/期間/件数上限)で服薬記録を返す。
-- NULL を渡した条件は無視される。SQL を文字列連結で組み立てずに済ませるための形。
SELECT "id", "memberId", "medicationId", "userId", "scheduleId", "takenAt", "notes", "dosageAmount"
FROM "MedicationRecord"
WHERE "userId" = sqlc.arg(user_id)
  AND (sqlc.narg(member_id)::text IS NULL OR "memberId" = sqlc.narg(member_id)::text)
  AND (sqlc.narg(from_at)::timestamptz IS NULL OR "takenAt" >= sqlc.narg(from_at)::timestamptz)
  AND (sqlc.narg(to_at)::timestamptz IS NULL OR "takenAt" < sqlc.narg(to_at)::timestamptz)
ORDER BY "takenAt" DESC
LIMIT sqlc.narg(row_limit)::int;
