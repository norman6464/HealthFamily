-- name: ListHospitals :many
SELECT "id", "userId", "name", "hospitalType", "address", "phoneNumber", "department", "doctorName", "notes", "createdAt"
FROM "Hospital"
WHERE "userId" = $1
ORDER BY "createdAt" DESC;

-- name: GetHospital :one
SELECT "id", "userId", "name", "hospitalType", "address", "phoneNumber", "department", "doctorName", "notes", "createdAt"
FROM "Hospital"
WHERE "id" = $1;
