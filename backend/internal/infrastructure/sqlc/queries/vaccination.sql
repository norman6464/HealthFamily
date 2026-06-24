-- name: ListVaccinations :many
SELECT "id", "userId", "memberId", "vaccineName", "vaccinatedAt", "nextScheduledDate", "notes", "createdAt"
FROM "Vaccination"
WHERE "userId" = $1
ORDER BY "vaccinatedAt" DESC;

-- name: GetVaccination :one
SELECT "id", "userId", "memberId", "vaccineName", "vaccinatedAt", "nextScheduledDate", "notes", "createdAt"
FROM "Vaccination"
WHERE "id" = $1;
