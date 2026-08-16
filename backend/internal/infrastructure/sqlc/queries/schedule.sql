-- name: ListSchedulesByUser :many
SELECT "id", "medicationId", "userId", "memberId", "scheduledTime", "daysOfWeek",
       "intervalDays", "startDate", "isEnabled", "reminderMinutesBefore", "createdAt"
FROM "Schedule"
WHERE "userId" = $1
ORDER BY "scheduledTime" ASC;

-- name: GetSchedule :one
SELECT "id", "medicationId", "userId", "memberId", "scheduledTime", "daysOfWeek",
       "intervalDays", "startDate", "isEnabled", "reminderMinutesBefore", "createdAt"
FROM "Schedule"
WHERE "id" = $1;

-- name: ListTodaySchedules :many
-- 当日有効なスケジュールを薬・メンバー情報と結合して返す。
-- is_completed の所有者一致 (r."userId" = s."userId") は必須。外れると、
-- 他人のアカウントから作られた記録だけで「服薬済み」と表示され、
-- 当人へのリマインドが黙って消える。
SELECT s."id", s."medicationId", s."userId", s."memberId", s."scheduledTime",
       s."daysOfWeek", s."intervalDays", s."startDate", s."isEnabled",
       s."reminderMinutesBefore", s."createdAt",
       m."name" AS medication_name,
       mem."name" AS member_name,
       mem."memberType" AS member_type,
       m."displayOrder" AS display_order,
       EXISTS(
         SELECT 1 FROM "MedicationRecord" r
         WHERE r."scheduleId" = s."id" AND r."userId" = s."userId"
           AND r."takenAt" >= sqlc.arg(day_start)::timestamptz
           AND r."takenAt" < sqlc.arg(day_end)::timestamptz
       ) AS is_completed
FROM "Schedule" s
JOIN "Medication" m ON m."id" = s."medicationId"
JOIN "Member" mem ON mem."id" = s."memberId"
WHERE s."userId" = sqlc.arg(user_id)
  AND s."isEnabled" = TRUE
  AND m."isActive" = TRUE
  AND m."status" NOT IN ('paused', 'discontinued')
  AND (array_length(s."daysOfWeek", 1) IS NULL OR sqlc.arg(weekday)::text = ANY(s."daysOfWeek"))
ORDER BY s."scheduledTime" ASC;
