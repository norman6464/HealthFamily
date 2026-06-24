package persistence

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"gorm.io/gorm"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/sqlc/sqlcgen"
	"healthfamily/internal/pkg/auth"
)

// scheduleColumns は当日スケジュールの結合クエリ(GetTodaySchedules)で利用する列一覧。
const scheduleColumns = `"id", "medicationId", "userId", "memberId", "scheduledTime", "daysOfWeek",
	"intervalDays", "startDate", "isEnabled", "reminderMinutesBefore", "createdAt"`

// ScheduleRepository は "Schedule" テーブルのリポジトリ。
// 検索系(ListByUser/FindByID)は sqlc、書き込み系(Create/Update/Delete)は GORM。
// pool は当日スケジュールの結合/集計クエリ(GetTodaySchedules)で生SQLに利用する。
type ScheduleRepository struct {
	gdb  *gorm.DB
	q    *sqlcgen.Queries
	pool *pgxpool.Pool
}

func NewScheduleRepository(db *database.DB) *ScheduleRepository {
	return &ScheduleRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool), pool: db.Pool}
}

func scheduleFromSqlc(s sqlcgen.Schedule) entity.Schedule {
	return entity.Schedule{
		ID:                    s.ID,
		MedicationID:          s.MedicationId,
		UserID:                s.UserId,
		MemberID:              s.MemberId,
		ScheduledTime:         s.ScheduledTime,
		DaysOfWeek:            s.DaysOfWeek,
		IntervalDays:          intPtr(s.IntervalDays),
		StartDate:             s.StartDate,
		IsEnabled:             s.IsEnabled,
		ReminderMinutesBefore: int(s.ReminderMinutesBefore),
		CreatedAt:             s.CreatedAt,
	}
}

func (r *ScheduleRepository) ListByUser(ctx context.Context, userID string) ([]entity.Schedule, error) {
	rows, err := r.q.ListSchedulesByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.Schedule, 0, len(rows))
	for _, s := range rows {
		list = append(list, scheduleFromSqlc(s))
	}
	return list, nil
}

func (r *ScheduleRepository) FindByID(ctx context.Context, id string) (*entity.Schedule, error) {
	s, err := r.q.GetSchedule(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := scheduleFromSqlc(s)
	return &e, nil
}

func (r *ScheduleRepository) Create(ctx context.Context, in repository.CreateScheduleInput) (*entity.Schedule, error) {
	days := in.DaysOfWeek
	if days == nil {
		days = []string{} // NOT NULL 列のため空配列に正規化
	}
	m := gormSchedule{
		ID:                    auth.NewID(),
		MedicationID:          in.MedicationID,
		UserID:                in.UserID,
		MemberID:              in.MemberID,
		ScheduledTime:         in.ScheduledTime,
		DaysOfWeek:            days,
		IntervalDays:          in.IntervalDays,
		StartDate:             in.StartDate,
		IsEnabled:             in.IsEnabled,
		ReminderMinutesBefore: in.ReminderMinutesBefore,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *ScheduleRepository) Update(ctx context.Context, id string, in repository.UpdateScheduleInput) (*entity.Schedule, error) {
	fields := map[string]any{}
	if in.ScheduledTime != nil {
		fields["scheduledTime"] = *in.ScheduledTime
	}
	if in.DaysOfWeek != nil {
		fields["daysOfWeek"] = in.DaysOfWeek
	}
	if in.IntervalDays != nil {
		fields["intervalDays"] = *in.IntervalDays
	}
	if in.StartDate != nil {
		fields["startDate"] = *in.StartDate
	}
	if in.IsEnabled != nil {
		fields["isEnabled"] = *in.IsEnabled
	}
	if in.ReminderMinutesBefore != nil {
		fields["reminderMinutesBefore"] = *in.ReminderMinutesBefore
	}
	if len(fields) > 0 {
		if err := r.gdb.WithContext(ctx).Model(&gormSchedule{}).
			Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(ctx, id)
}

func (r *ScheduleRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormSchedule{}).Error
}

// GetTodaySchedules は当日有効なスケジュールを薬・メンバー情報と結合して返す。
// 曜日(daysOfWeek)が指定されている場合は当日の曜日に一致するもののみ対象。
// 動的な結合/集計のため生SQL(pgx)を維持する。
func (r *ScheduleRepository) GetTodaySchedules(ctx context.Context, userID string, date time.Time) ([]entity.TodaySchedule, error) {
	weekday := []string{"sun", "mon", "tue", "wed", "thu", "fri", "sat"}[int(date.Weekday())]
	dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	dayEnd := dayStart.Add(24 * time.Hour)

	rows, err := r.pool.Query(ctx,
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
		   AND m."isActive" = TRUE
		   AND m."status" NOT IN ('paused', 'discontinued')
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
