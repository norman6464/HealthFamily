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

// PrescriptionRepository は "Prescription" テーブルの生SQL実装
type PrescriptionRepository struct {
	db *database.DB
}

func NewPrescriptionRepository(db *database.DB) *PrescriptionRepository {
	return &PrescriptionRepository{db: db}
}

const prescriptionColumns = `"id", "userId", "memberId", "prescriptionName", "prescribedBy", "prescribedAt", "expiresAt", "pharmacyName", "notes", "createdAt"`

func scanPrescription(row pgx.Row) (*entity.Prescription, error) {
	var p entity.Prescription
	err := row.Scan(&p.ID, &p.UserID, &p.MemberID, &p.PrescriptionName, &p.PrescribedBy, &p.PrescribedAt, &p.ExpiresAt, &p.PharmacyName, &p.Notes, &p.CreatedAt)
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
		`SELECT `+prescriptionColumns+` FROM "Prescription" WHERE "userId"=$1 ORDER BY "createdAt" DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.Prescription, 0)
	for rows.Next() {
		var p entity.Prescription
		if err := rows.Scan(&p.ID, &p.UserID, &p.MemberID, &p.PrescriptionName, &p.PrescribedBy, &p.PrescribedAt, &p.ExpiresAt, &p.PharmacyName, &p.Notes, &p.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, rows.Err()
}

func (r *PrescriptionRepository) FindByID(ctx context.Context, id string) (*entity.Prescription, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+prescriptionColumns+` FROM "Prescription" WHERE "id"=$1`, id)
	return scanPrescription(row)
}

func (r *PrescriptionRepository) Create(ctx context.Context, in repository.CreatePrescriptionInput) (*entity.Prescription, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "Prescription" ("id", "userId", "memberId", "prescriptionName", "prescribedBy", "prescribedAt", "expiresAt", "pharmacyName", "notes", "createdAt")
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
		 RETURNING `+prescriptionColumns,
		id, in.UserID, in.MemberID, in.PrescriptionName, in.PrescribedBy, in.PrescribedAt, in.ExpiresAt, in.PharmacyName, in.Notes)
	return scanPrescription(row)
}

func (r *PrescriptionRepository) Update(ctx context.Context, id string, in repository.UpdatePrescriptionInput) (*entity.Prescription, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE "Prescription" SET
			"prescriptionName" = COALESCE($2, "prescriptionName"),
			"prescribedBy" = COALESCE($3, "prescribedBy"),
			"prescribedAt" = COALESCE($4, "prescribedAt"),
			"expiresAt" = COALESCE($5, "expiresAt"),
			"pharmacyName" = COALESCE($6, "pharmacyName"),
			"notes" = COALESCE($7, "notes")
		 WHERE "id"=$1
		 RETURNING `+prescriptionColumns,
		id, in.PrescriptionName, in.PrescribedBy, in.PrescribedAt, in.ExpiresAt, in.PharmacyName, in.Notes)
	return scanPrescription(row)
}

func (r *PrescriptionRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM "Prescription" WHERE "id"=$1`, id)
	return err
}
