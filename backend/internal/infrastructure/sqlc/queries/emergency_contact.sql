-- name: ListEmergencyContacts :many
SELECT "id", "userId", "memberId", "contactName", "phoneNumber", "relationship", "notes", "createdAt"
FROM "EmergencyContact"
WHERE "userId" = $1
ORDER BY "createdAt" DESC;

-- name: GetEmergencyContact :one
SELECT "id", "userId", "memberId", "contactName", "phoneNumber", "relationship", "notes", "createdAt"
FROM "EmergencyContact"
WHERE "id" = $1;
