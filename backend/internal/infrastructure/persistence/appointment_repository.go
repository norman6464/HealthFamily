package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"gorm.io/gorm"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/sqlc/sqlcgen"
	"healthfamily/internal/pkg/auth"
)

// AppointmentRepository は "Appointment" テーブルのリポジトリ。
// 検索系(List/FindByID)は sqlc、書き込み系(Create/Update/Delete)は GORM を使う。
type AppointmentRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewAppointmentRepository(db *database.DB) *AppointmentRepository {
	return &AppointmentRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func appointmentFromSqlc(a sqlcgen.Appointment) entity.Appointment {
	return entity.Appointment{
		ID:                 a.ID,
		UserID:             a.UserId,
		MemberID:           a.MemberId,
		HospitalID:         a.HospitalId,
		AppointmentType:    a.AppointmentType,
		AppointmentDate:    a.AppointmentDate,
		Description:        a.Description,
		TestResults:        a.TestResults,
		Cost:               a.Cost,
		ReminderEnabled:    a.ReminderEnabled,
		ReminderDaysBefore: int(a.ReminderDaysBefore),
		CreatedAt:          a.CreatedAt,
	}
}

func (r *AppointmentRepository) List(ctx context.Context, userID string) ([]entity.Appointment, error) {
	rows, err := r.q.ListAppointments(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.Appointment, 0, len(rows))
	for _, a := range rows {
		list = append(list, appointmentFromSqlc(a))
	}
	return list, nil
}

func (r *AppointmentRepository) FindByID(ctx context.Context, id string) (*entity.Appointment, error) {
	a, err := r.q.GetAppointment(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := appointmentFromSqlc(a)
	return &e, nil
}

func (r *AppointmentRepository) Create(ctx context.Context, in repository.CreateAppointmentInput) (*entity.Appointment, error) {
	// 旧実装の COALESCE 既定値（reminderEnabled=TRUE, reminderDaysBefore=1）を Go 側で再現する。
	reminderEnabled := true
	if in.ReminderEnabled != nil {
		reminderEnabled = *in.ReminderEnabled
	}
	reminderDaysBefore := 1
	if in.ReminderDaysBefore != nil {
		reminderDaysBefore = *in.ReminderDaysBefore
	}
	m := gormAppointment{
		ID:                 auth.NewID(),
		UserID:             in.UserID,
		MemberID:           in.MemberID,
		HospitalID:         in.HospitalID,
		AppointmentType:    in.AppointmentType,
		AppointmentDate:    in.AppointmentDate,
		Description:        in.Description,
		TestResults:        in.TestResults,
		Cost:               in.Cost,
		ReminderEnabled:    reminderEnabled,
		ReminderDaysBefore: reminderDaysBefore,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *AppointmentRepository) Update(ctx context.Context, id string, in repository.UpdateAppointmentInput) (*entity.Appointment, error) {
	fields := map[string]any{}
	if in.HospitalID != nil {
		fields["hospitalId"] = *in.HospitalID
	}
	if in.AppointmentType != nil {
		fields["appointmentType"] = *in.AppointmentType
	}
	if in.AppointmentDate != nil {
		fields["appointmentDate"] = *in.AppointmentDate
	}
	if in.Description != nil {
		fields["description"] = *in.Description
	}
	if in.TestResults != nil {
		fields["testResults"] = *in.TestResults
	}
	if in.Cost != nil {
		fields["cost"] = *in.Cost
	}
	if in.ReminderEnabled != nil {
		fields["reminderEnabled"] = *in.ReminderEnabled
	}
	if in.ReminderDaysBefore != nil {
		fields["reminderDaysBefore"] = *in.ReminderDaysBefore
	}
	if len(fields) > 0 {
		if err := r.gdb.WithContext(ctx).Model(&gormAppointment{}).
			Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(ctx, id)
}

func (r *AppointmentRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormAppointment{}).Error
}
