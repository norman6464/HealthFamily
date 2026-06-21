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

// AppointmentRepository は "Appointment" テーブルの生SQL実装
type AppointmentRepository struct {
	db *database.DB
}

func NewAppointmentRepository(db *database.DB) *AppointmentRepository {
	return &AppointmentRepository{db: db}
}

const appointmentColumns = `"id", "userId", "memberId", "hospitalId", "appointmentType", "appointmentDate", "description", "testResults", "cost", "reminderEnabled", "reminderDaysBefore", "createdAt"`

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
		`SELECT `+appointmentColumns+` FROM "Appointment" WHERE "userId"=$1 ORDER BY "appointmentDate" DESC`, userID)
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
	row := r.db.Pool.QueryRow(ctx, `SELECT `+appointmentColumns+` FROM "Appointment" WHERE "id"=$1`, id)
	return scanAppointment(row)
}

func (r *AppointmentRepository) Create(ctx context.Context, in repository.CreateAppointmentInput) (*entity.Appointment, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "Appointment" ("id", "userId", "memberId", "hospitalId", "appointmentType", "appointmentDate", "description", "testResults", "cost", "reminderEnabled", "reminderDaysBefore", "createdAt")
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10, TRUE), COALESCE($11, 1), now())
		 RETURNING `+appointmentColumns,
		id, in.UserID, in.MemberID, in.HospitalID, in.AppointmentType, in.AppointmentDate, in.Description,
		in.TestResults, in.Cost, in.ReminderEnabled, in.ReminderDaysBefore)
	return scanAppointment(row)
}

func (r *AppointmentRepository) Update(ctx context.Context, id string, in repository.UpdateAppointmentInput) (*entity.Appointment, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE "Appointment" SET
			"hospitalId" = COALESCE($2, "hospitalId"),
			"appointmentType" = COALESCE($3, "appointmentType"),
			"appointmentDate" = COALESCE($4, "appointmentDate"),
			"description" = COALESCE($5, "description"),
			"testResults" = COALESCE($6, "testResults"),
			"cost" = COALESCE($7, "cost"),
			"reminderEnabled" = COALESCE($8, "reminderEnabled"),
			"reminderDaysBefore" = COALESCE($9, "reminderDaysBefore")
		 WHERE "id"=$1
		 RETURNING `+appointmentColumns,
		id, in.HospitalID, in.AppointmentType, in.AppointmentDate, in.Description, in.TestResults,
		in.Cost, in.ReminderEnabled, in.ReminderDaysBefore)
	return scanAppointment(row)
}

func (r *AppointmentRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM "Appointment" WHERE "id"=$1`, id)
	return err
}
