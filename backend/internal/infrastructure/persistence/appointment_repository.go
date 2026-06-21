package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/pkg/auth"
)

// AppointmentRepository は appointments テーブルの生SQL実装
type AppointmentRepository struct {
	db *database.DB
}

func NewAppointmentRepository(db *database.DB) *AppointmentRepository {
	return &AppointmentRepository{db: db}
}

const appointmentColumns = `id, user_id, member_id, hospital_id, appointment_type, appointment_date, description, test_results, cost, reminder_enabled, reminder_days_before, created_at`

func scanAppointment(row pgx.Row) (*entity.Appointment, error) {
	var a entity.Appointment
	err := row.Scan(&a.ID, &a.UserID, &a.MemberID, &a.HospitalID, &a.AppointmentType, &a.AppointmentDate,
		&a.Description, &a.TestResults, &a.Cost, &a.ReminderEnabled, &a.ReminderDaysBefore, &a.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *AppointmentRepository) List(ctx context.Context, userID string) ([]entity.Appointment, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+appointmentColumns+` FROM appointments WHERE user_id=$1 ORDER BY appointment_date DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.Appointment, 0)
	for rows.Next() {
		var a entity.Appointment
		if err := rows.Scan(&a.ID, &a.UserID, &a.MemberID, &a.HospitalID, &a.AppointmentType, &a.AppointmentDate,
			&a.Description, &a.TestResults, &a.Cost, &a.ReminderEnabled, &a.ReminderDaysBefore, &a.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, rows.Err()
}

func (r *AppointmentRepository) FindByID(ctx context.Context, id string) (*entity.Appointment, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+appointmentColumns+` FROM appointments WHERE id=$1`, id)
	return scanAppointment(row)
}

func (r *AppointmentRepository) Create(ctx context.Context, in repository.CreateAppointmentInput) (*entity.Appointment, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO appointments (id, user_id, member_id, hospital_id, appointment_type, appointment_date, description, test_results, cost, reminder_enabled, reminder_days_before, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10, TRUE), COALESCE($11, 1), now())
		 RETURNING `+appointmentColumns,
		id, in.UserID, in.MemberID, in.HospitalID, in.AppointmentType, in.AppointmentDate, in.Description,
		in.TestResults, in.Cost, in.ReminderEnabled, in.ReminderDaysBefore)
	return scanAppointment(row)
}

func (r *AppointmentRepository) Update(ctx context.Context, id string, in repository.UpdateAppointmentInput) (*entity.Appointment, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE appointments SET
			hospital_id = COALESCE($2, hospital_id),
			appointment_type = COALESCE($3, appointment_type),
			appointment_date = COALESCE($4, appointment_date),
			description = COALESCE($5, description),
			test_results = COALESCE($6, test_results),
			cost = COALESCE($7, cost),
			reminder_enabled = COALESCE($8, reminder_enabled),
			reminder_days_before = COALESCE($9, reminder_days_before)
		 WHERE id=$1
		 RETURNING `+appointmentColumns,
		id, in.HospitalID, in.AppointmentType, in.AppointmentDate, in.Description, in.TestResults,
		in.Cost, in.ReminderEnabled, in.ReminderDaysBefore)
	return scanAppointment(row)
}

func (r *AppointmentRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM appointments WHERE id=$1`, id)
	return err
}
