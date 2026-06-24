-- name: ListInsurances :many
SELECT "id", "userId", "memberId", "insuranceType", "providerName", "policyNumber", "notes", "createdAt"
FROM "Insurance"
WHERE "userId" = $1
ORDER BY "createdAt" DESC;

-- name: GetInsurance :one
SELECT "id", "userId", "memberId", "insuranceType", "providerName", "policyNumber", "notes", "createdAt"
FROM "Insurance"
WHERE "id" = $1;
