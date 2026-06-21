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

// AllergyRepository は allergies テーブルの生SQL実装
type AllergyRepository struct {
	db *database.DB
}

func NewAllergyRepository(db *database.DB) *AllergyRepository {
	return &AllergyRepository{db: db}
}

const allergyColumns = `id, user_id, member_id, allergen_name, allergy_type, severity, symptoms, diagnosed_at, notes, created_at`

func scanAllergy(row pgx.Row) (*entity.Allergy, error) {
	var a entity.Allergy
	err := row.Scan(&a.ID, &a.UserID, &a.MemberID, &a.AllergenName, &a.AllergyType, &a.Severity, &a.Symptoms, &a.DiagnosedAt, &a.Notes, &a.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *AllergyRepository) List(ctx context.Context, userID string) ([]entity.Allergy, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+allergyColumns+` FROM allergies WHERE user_id=$1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.Allergy, 0)
	for rows.Next() {
		var a entity.Allergy
		if err := rows.Scan(&a.ID, &a.UserID, &a.MemberID, &a.AllergenName, &a.AllergyType, &a.Severity, &a.Symptoms, &a.DiagnosedAt, &a.Notes, &a.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, rows.Err()
}

func (r *AllergyRepository) FindByID(ctx context.Context, id string) (*entity.Allergy, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+allergyColumns+` FROM allergies WHERE id=$1`, id)
	return scanAllergy(row)
}

func (r *AllergyRepository) Create(ctx context.Context, in repository.CreateAllergyInput) (*entity.Allergy, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO allergies (id, user_id, member_id, allergen_name, allergy_type, severity, symptoms, diagnosed_at, notes, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
		 RETURNING `+allergyColumns,
		id, in.UserID, in.MemberID, in.AllergenName, in.AllergyType, in.Severity, in.Symptoms, in.DiagnosedAt, in.Notes)
	return scanAllergy(row)
}

func (r *AllergyRepository) Update(ctx context.Context, id string, in repository.UpdateAllergyInput) (*entity.Allergy, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE allergies SET
			allergen_name = COALESCE($2, allergen_name),
			allergy_type = COALESCE($3, allergy_type),
			severity = COALESCE($4, severity),
			symptoms = COALESCE($5, symptoms),
			diagnosed_at = COALESCE($6, diagnosed_at),
			notes = COALESCE($7, notes)
		 WHERE id=$1
		 RETURNING `+allergyColumns,
		id, in.AllergenName, in.AllergyType, in.Severity, in.Symptoms, in.DiagnosedAt, in.Notes)
	return scanAllergy(row)
}

func (r *AllergyRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM allergies WHERE id=$1`, id)
	return err
}
