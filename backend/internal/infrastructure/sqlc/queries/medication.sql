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

-- name: ListMedicationAlerts :many
-- 在庫僅少(残数が閾値以下、もしくは在庫アラート日が7日以内)の有効な薬。
SELECT "id", "memberId", "userId", "name", "category", "dosageAmount", "frequency",
       "stockQuantity", "stockAlertDate", "intervalHours", "instructions", "displayOrder",
       "isActive", "status", "createdAt", "updatedAt"
FROM "Medication"
WHERE "userId" = $1
  AND "isActive" = TRUE
  AND (
    ("stockQuantity" IS NOT NULL AND "stockQuantity" <= $2)
    OR ("stockAlertDate" IS NOT NULL AND "stockAlertDate" <= now() + interval '7 days')
  )
ORDER BY "stockQuantity" ASC NULLS LAST, "createdAt" ASC;
