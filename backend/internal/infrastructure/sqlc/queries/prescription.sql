-- name: GetPrescription :one
SELECT "id", "userId", "memberId", "prescriptionName", "prescribedBy", "prescribedAt", "expiresAt", "pharmacyName", "electronicCode", "notes", "createdAt"
FROM "Prescription"
WHERE "id" = $1;

-- name: ListPrescriptionItems :many
SELECT "id", "prescriptionId", "name", "dosage", "frequency", "days", "sortOrder"
FROM "PrescriptionItem"
WHERE "prescriptionId" = $1
ORDER BY "sortOrder", "createdAt";
