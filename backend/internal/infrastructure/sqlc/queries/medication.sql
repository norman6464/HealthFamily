-- name: ListMedicationsByMember :many
SELECT "id", "memberId", "userId", "name", "category", "dosageAmount", "frequency",
       "stockQuantity", "stockAlertDate", "intervalHours", "instructions", "displayOrder",
       "isActive", "status", "createdAt", "updatedAt"
FROM "Medication"
WHERE "memberId" = $1
ORDER BY "displayOrder" ASC, "createdAt" ASC;

-- name: ListMedicationsByUser :many
SELECT "id", "memberId", "userId", "name", "category", "dosageAmount", "frequency",
       "stockQuantity", "stockAlertDate", "intervalHours", "instructions", "displayOrder",
       "isActive", "status", "createdAt", "updatedAt"
FROM "Medication"
WHERE "userId" = $1
ORDER BY "displayOrder" ASC, "createdAt" ASC;

-- name: GetMedication :one
SELECT "id", "memberId", "userId", "name", "category", "dosageAmount", "frequency",
       "stockQuantity", "stockAlertDate", "intervalHours", "instructions", "displayOrder",
       "isActive", "status", "createdAt", "updatedAt"
FROM "Medication"
WHERE "id" = $1;
