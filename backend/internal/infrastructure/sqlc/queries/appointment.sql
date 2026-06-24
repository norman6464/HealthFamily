-- name: ListAppointments :many
SELECT "id", "userId", "memberId", "hospitalId", "appointmentType", "appointmentDate", "description", "testResults", "cost", "reminderEnabled", "reminderDaysBefore", "createdAt"
FROM "Appointment"
WHERE "userId" = $1
ORDER BY "appointmentDate" DESC;

-- name: GetAppointment :one
SELECT "id", "userId", "memberId", "hospitalId", "appointmentType", "appointmentDate", "description", "testResults", "cost", "reminderEnabled", "reminderDaysBefore", "createdAt"
FROM "Appointment"
WHERE "id" = $1;
