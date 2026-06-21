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

// VaccinationRepository は "Vaccination" テーブルの生SQL実装
type VaccinationRepository struct {
	db *database.DB
}

func NewVaccinationRepository(db *database.DB) *VaccinationRepository {
	return &VaccinationRepository{db: db}
}

const vaccinationColumns = `"id", "userId", "memberId", "vaccineName", "vaccinatedAt", "nextScheduledDate", "notes", "createdAt"`

func scanVaccination(row pgx.Row) (*entity.Vaccination, error) {
	var v entity.Vaccination
	err := row.Scan(&v.ID, &v.UserID, &v.MemberID, &v.VaccineName, &v.VaccinatedAt, &v.NextScheduledDate, &v.Notes, &v.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *VaccinationRepository) List(ctx context.Context, userID string) ([]entity.Vaccination, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+vaccinationColumns+` FROM "Vaccination" WHERE "userId"=$1 ORDER BY "vaccinatedAt" DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.Vaccination, 0)
	for rows.Next() {
		var v entity.Vaccination
		if err := rows.Scan(&v.ID, &v.UserID, &v.MemberID, &v.VaccineName, &v.VaccinatedAt, &v.NextScheduledDate, &v.Notes, &v.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, v)
	}
	return list, rows.Err()
}

func (r *VaccinationRepository) FindByID(ctx context.Context, id string) (*entity.Vaccination, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+vaccinationColumns+` FROM "Vaccination" WHERE "id"=$1`, id)
	return scanVaccination(row)
}

func (r *VaccinationRepository) Create(ctx context.Context, in repository.CreateVaccinationInput) (*entity.Vaccination, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "Vaccination" ("id", "userId", "memberId", "vaccineName", "vaccinatedAt", "nextScheduledDate", "notes", "createdAt")
		 VALUES ($1,$2,$3,$4,$5,$6,$7, now())
		 RETURNING `+vaccinationColumns,
		id, in.UserID, in.MemberID, in.VaccineName, in.VaccinatedAt, in.NextScheduledDate, in.Notes)
	return scanVaccination(row)
}

func (r *VaccinationRepository) Update(ctx context.Context, id string, in repository.UpdateVaccinationInput) (*entity.Vaccination, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE "Vaccination" SET
			"vaccineName" = COALESCE($2, "vaccineName"),
			"vaccinatedAt" = COALESCE($3, "vaccinatedAt"),
			"nextScheduledDate" = COALESCE($4, "nextScheduledDate"),
			"notes" = COALESCE($5, "notes")
		 WHERE "id"=$1
		 RETURNING `+vaccinationColumns,
		id, in.VaccineName, in.VaccinatedAt, in.NextScheduledDate, in.Notes)
	return scanVaccination(row)
}

func (r *VaccinationRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM "Vaccination" WHERE "id"=$1`, id)
	return err
}
