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

// HospitalRepository は hospitals テーブルの生SQL実装
type HospitalRepository struct {
	db *database.DB
}

func NewHospitalRepository(db *database.DB) *HospitalRepository {
	return &HospitalRepository{db: db}
}

const hospitalColumns = `id, user_id, name, hospital_type, address, phone_number, department, doctor_name, notes, created_at`

func scanHospital(row pgx.Row) (*entity.Hospital, error) {
	var h entity.Hospital
	err := row.Scan(&h.ID, &h.UserID, &h.Name, &h.HospitalType, &h.Address, &h.PhoneNumber,
		&h.Department, &h.DoctorName, &h.Notes, &h.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *HospitalRepository) List(ctx context.Context, userID string) ([]entity.Hospital, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+hospitalColumns+` FROM hospitals WHERE user_id=$1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.Hospital, 0)
	for rows.Next() {
		var h entity.Hospital
		if err := rows.Scan(&h.ID, &h.UserID, &h.Name, &h.HospitalType, &h.Address, &h.PhoneNumber,
			&h.Department, &h.DoctorName, &h.Notes, &h.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, h)
	}
	return list, rows.Err()
}

func (r *HospitalRepository) FindByID(ctx context.Context, id string) (*entity.Hospital, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+hospitalColumns+` FROM hospitals WHERE id=$1`, id)
	return scanHospital(row)
}

func (r *HospitalRepository) Create(ctx context.Context, in repository.CreateHospitalInput) (*entity.Hospital, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO hospitals (id, user_id, name, hospital_type, address, phone_number, department, doctor_name, notes, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
		 RETURNING `+hospitalColumns,
		id, in.UserID, in.Name, in.HospitalType, in.Address, in.PhoneNumber, in.Department, in.DoctorName, in.Notes)
	return scanHospital(row)
}

func (r *HospitalRepository) Update(ctx context.Context, id string, in repository.UpdateHospitalInput) (*entity.Hospital, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE hospitals SET
			name = COALESCE($2, name),
			hospital_type = COALESCE($3, hospital_type),
			address = COALESCE($4, address),
			phone_number = COALESCE($5, phone_number),
			department = COALESCE($6, department),
			doctor_name = COALESCE($7, doctor_name),
			notes = COALESCE($8, notes)
		 WHERE id=$1
		 RETURNING `+hospitalColumns,
		id, in.Name, in.HospitalType, in.Address, in.PhoneNumber, in.Department, in.DoctorName, in.Notes)
	return scanHospital(row)
}

func (r *HospitalRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM hospitals WHERE id=$1`, id)
	return err
}
