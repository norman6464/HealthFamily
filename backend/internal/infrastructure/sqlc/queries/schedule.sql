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
