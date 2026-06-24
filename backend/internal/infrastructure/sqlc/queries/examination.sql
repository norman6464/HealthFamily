-- name: ListExaminations :many
SELECT "id", "userId", "memberId", "examinationType", "examinedAt", "nextScheduledDate", "notes", "imageData", "createdAt"
FROM "Examination"
WHERE "userId" = $1
ORDER BY "examinedAt" DESC;

-- name: GetExamination :one
SELECT "id", "userId", "memberId", "examinationType", "examinedAt", "nextScheduledDate", "notes", "imageData", "createdAt"
FROM "Examination"
WHERE "id" = $1;
