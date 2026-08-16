-- name: GetPrescription :one
SELECT "id", "userId", "memberId", "prescriptionName", "prescribedBy", "prescribedAt", "expiresAt", "pharmacyName", "electronicCode", "notes", "createdAt"
FROM "Prescription"
WHERE "id" = $1;

-- name: ListPrescriptionItems :many
SELECT "id", "prescriptionId", "name", "dosage", "frequency", "days", "sortOrder"
FROM "PrescriptionItem"
WHERE "prescriptionId" = $1
ORDER BY "sortOrder", "createdAt";

-- name: ListPrescriptionsByUser :many
SELECT "id", "userId", "memberId", "prescriptionName", "prescribedBy", "prescribedAt",
       "expiresAt", "pharmacyName", "electronicCode", "notes", "createdAt"
FROM "Prescription"
WHERE "userId" = $1
ORDER BY "createdAt" DESC;

-- name: ListPrescriptionItemsForPrescriptions :many
-- 複数の処方箋の明細をまとめて引く。処方箋ごとに引くと件数分の往復になる。
SELECT "id", "prescriptionId", "name", "dosage", "frequency", "days", "sortOrder"
FROM "PrescriptionItem"
WHERE "prescriptionId" = ANY(sqlc.arg(prescription_ids)::text[])
ORDER BY "sortOrder", "createdAt";
