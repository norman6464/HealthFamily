package persistence

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/pkg/auth"
)

// ScheduleRepository は "Schedule" テーブルの生SQL実装
type ScheduleRepository struct {
	db *database.DB
}

func NewScheduleRepository(db *database.DB) *ScheduleRepository {
	return &ScheduleRepository{db: db}
}

const scheduleColumns = `"id", "medicationId", "userId", "memberId", "scheduledTime", "daysOfWeek",
	"intervalDays", "startDate", "isEnabled", "reminderMinutesBefore", "createdAt"`

func scanSchedule(row pgx.Row) (*entity.Schedule, error) {
	var s entity.Schedule
	err := row.Scan(&s.ID, &s.MedicationID, &s.UserID, &s.MemberID, &s.ScheduledTime,
		&s.DaysOfWeek, &s.IntervalDays, &s.StartDate, &s.IsEnabled, &s.ReminderMinutesBefore, &s.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *ScheduleRepository) ListByUser(ctx context.Context, userID string) ([]entity.Schedule, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+scheduleColumns+` FROM "Schedule" WHERE "userId"=$1 ORDER BY "scheduledTime" ASC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.Schedule, 0)
	for rows.Next() {
		var s entity.Schedule
		if err := rows.Scan(&s.ID, &s.MedicationID, &s.UserID, &s.MemberID, &s.ScheduledTime,
			&s.DaysOfWeek, &s.IntervalDays, &s.StartDate, &s.IsEnabled, &s.ReminderMinutesBefore, &s.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, rows.Err()
}

func (r *ScheduleRepository) FindByID(ctx context.Context, id string) (*entity.Schedule, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+scheduleColumns+` FROM "Schedule" WHERE "id"=$1`, id)
	return scanSchedule(row)
}

func (r *ScheduleRepository) Create(ctx context.Context, in repository.CreateScheduleInput) (*entity.Schedule, error) {
	id := auth.NewID()
	days := in.DaysOfWeek
	if days == nil {
		days = []string{}
	}
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "Schedule" ("id", "medicationId", "userId", "memberId", "scheduledTime", "daysOfWeek",
			"intervalDays", "startDate", "isEnabled", "reminderMinutesBefore", "createdAt")
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
		 RETURNING `+scheduleColumns,
		id, in.MedicationID, in.UserID, in.MemberID, in.ScheduledTime, days,
		in.IntervalDays, in.StartDate, in.IsEnabled, in.ReminderMinutesBefore)
	return scanSchedule(row)
}

func (r *ScheduleRepository) Update(ctx context.Context, id string, in repository.UpdateScheduleInput) (*entity.Schedule, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE "Schedule" SET
			"scheduledTime" = COALESCE($2, "scheduledTime"),
			"daysOfWeek" = COALESCE($3, "daysOfWeek"),
			"intervalDays" = COALESCE($4, "intervalDays"),
			"startDate" = COALESCE($5, "startDate"),
			"isEnabled" = COALESCE($6, "isEnabled"),
			"reminderMinutesBefore" = COALESCE($7, "reminderMinutesBefore")
		 WHERE "id"=$1
		 RETURNING `+scheduleColumns,
		id, in.ScheduledTime, in.DaysOfWeek, in.IntervalDays, in.StartDate, in.IsEnabled, in.ReminderMinutesBefore)
	return scanSchedule(row)
}

func (r *ScheduleRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM "Schedule" WHERE "id"=$1`, id)
	return err
}

// GetTodaySchedules は当日有効なスケジュールを薬・メンバー情報と結合して返す。
// 曜日(daysOfWeek)が指定されている場合は当日の曜日に一致するもののみ対象。
func (r *ScheduleRepository) GetTodaySchedules(ctx context.Context, userID string, date time.Time) ([]entity.TodaySchedule, error) {
	weekday := []string{"sun", "mon", "tue", "wed", "thu", "fri", "sat"}[int(date.Weekday())]
	dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	dayEnd := dayStart.Add(24 * time.Hour)

	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+prefixCols("s", scheduleColumns)+`,
			m."name", mem."name", mem."memberType", m."displayOrder",
			EXISTS(
				SELECT 1 FROM "MedicationRecord" r
				WHERE r."scheduleId" = s."id" AND r."takenAt" >= $3 AND r."takenAt" < $4
			) AS is_completed
		 FROM "Schedule" s
		 JOIN "Medication" m ON m."id" = s."medicationId"
		 JOIN "Member" mem ON mem."id" = s."memberId"
		 WHERE s."userId" = $1
		   AND s."isEnabled" = TRUE
		   AND (array_length(s."daysOfWeek", 1) IS NULL OR $2 = ANY(s."daysOfWeek"))
		 ORDER BY s."scheduledTime" ASC`,
		userID, weekday, dayStart, dayEnd)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]entity.TodaySchedule, 0)
	for rows.Next() {
		var t entity.TodaySchedule
		if err := rows.Scan(&t.ID, &t.MedicationID, &t.UserID, &t.MemberID, &t.ScheduledTime,
			&t.DaysOfWeek, &t.IntervalDays, &t.StartDate, &t.IsEnabled, &t.ReminderMinutesBefore, &t.CreatedAt,
			&t.MedicationName, &t.MemberName, &t.MemberType, &t.MedicationDisplayOrder, &t.IsCompleted); err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, rows.Err()
}

// prefixCols は `"id", "name"` を `s."id", s."name"` の形に変換する。
// 引用済みの camelCase カラム名をエイリアスで前置する。
func prefixCols(alias, cols string) string {
	parts := strings.Split(cols, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if c := strings.TrimSpace(p); c != "" {
			out = append(out, alias+"."+c)
		}
	}
	return strings.Join(out, ", ")
}
