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

// PrescriptionRepository は prescriptions テーブルの生SQL実装
type PrescriptionRepository struct {
	db *database.DB
}

func NewPrescriptionRepository(db *database.DB) *PrescriptionRepository {
	return &PrescriptionRepository{db: db}
}

const prescriptionColumns = `id, user_id, member_id, name, image_data, notes, prescribed_at, created_at`

func scanPrescription(row pgx.Row) (*entity.Prescription, error) {
	var p entity.Prescription
	err := row.Scan(&p.ID, &p.UserID, &p.MemberID, &p.Name, &p.ImageData, &p.Notes, &p.PrescribedAt, &p.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PrescriptionRepository) List(ctx context.Context, userID string) ([]entity.Prescription, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+prescriptionColumns+` FROM prescriptions WHERE user_id=$1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.Prescription, 0)
	for rows.Next() {
		var p entity.Prescription
		if err := rows.Scan(&p.ID, &p.UserID, &p.MemberID, &p.Name, &p.ImageData, &p.Notes, &p.PrescribedAt, &p.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, rows.Err()
}

func (r *PrescriptionRepository) FindByID(ctx context.Context, id string) (*entity.Prescription, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+prescriptionColumns+` FROM prescriptions WHERE id=$1`, id)
	return scanPrescription(row)
}

func (r *PrescriptionRepository) Create(ctx context.Context, in repository.CreatePrescriptionInput) (*entity.Prescription, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO prescriptions (id, user_id, member_id, name, image_data, notes, prescribed_at, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7, now())
		 RETURNING `+prescriptionColumns,
		id, in.UserID, in.MemberID, in.Name, in.ImageData, in.Notes, in.PrescribedAt)
	return scanPrescription(row)
}

func (r *PrescriptionRepository) Update(ctx context.Context, id string, in repository.UpdatePrescriptionInput) (*entity.Prescription, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE prescriptions SET
			name = COALESCE($2, name),
			image_data = COALESCE($3, image_data),
			notes = COALESCE($4, notes),
			prescribed_at = COALESCE($5, prescribed_at)
		 WHERE id=$1
		 RETURNING `+prescriptionColumns,
		id, in.Name, in.ImageData, in.Notes, in.PrescribedAt)
	return scanPrescription(row)
}

func (r *PrescriptionRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM prescriptions WHERE id=$1`, id)
	return err
}
