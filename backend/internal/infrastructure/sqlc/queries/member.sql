-- name: ListMembers :many
SELECT "id", "userId", "memberType", "name", "petType", "photoUrl", "birthDate", "notes", "createdAt", "updatedAt"
FROM "Member"
WHERE "userId" = $1
ORDER BY "createdAt" ASC;

-- name: GetMember :one
SELECT "id", "userId", "memberType", "name", "petType", "photoUrl", "birthDate", "notes", "createdAt", "updatedAt"
FROM "Member"
WHERE "id" = $1;

-- name: ListMemberSummaries :many
-- メンバーごとの薬数を単一SQLで集計する(N+1回避)。
SELECT m."id", m."userId", m."memberType", m."name", m."petType", m."photoUrl",
       m."birthDate", m."notes", m."createdAt", m."updatedAt",
       COUNT(med."id") AS medication_count,
       COUNT(med."id") FILTER (WHERE med."isActive") AS active_count
FROM "Member" m
LEFT JOIN "Medication" med ON med."memberId" = m."id"
WHERE m."userId" = $1
GROUP BY m."id"
ORDER BY m."createdAt" ASC;
