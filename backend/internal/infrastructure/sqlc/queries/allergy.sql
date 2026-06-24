-- name: ListAllergies :many
SELECT "id", "userId", "memberId", "allergenName", "allergyType", "severity", "symptoms", "diagnosedAt", "notes", "createdAt"
FROM "Allergy"
WHERE "userId" = $1
ORDER BY "createdAt" DESC;

-- name: GetAllergy :one
SELECT "id", "userId", "memberId", "allergenName", "allergyType", "severity", "symptoms", "diagnosedAt", "notes", "createdAt"
FROM "Allergy"
WHERE "id" = $1;
