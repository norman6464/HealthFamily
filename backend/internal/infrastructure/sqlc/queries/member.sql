-- name: ListMembers :many
SELECT "id", "userId", "memberType", "name", "petType", "photoUrl", "birthDate", "notes", "createdAt", "updatedAt"
FROM "Member"
WHERE "userId" = $1
ORDER BY "createdAt" ASC;

-- name: GetMember :one
SELECT "id", "userId", "memberType", "name", "petType", "photoUrl", "birthDate", "notes", "createdAt", "updatedAt"
FROM "Member"
WHERE "id" = $1;
