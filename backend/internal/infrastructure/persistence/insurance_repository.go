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

// InsuranceRepository は "Insurance" テーブルの生SQL実装
type InsuranceRepository struct {
	db *database.DB
}

func NewInsuranceRepository(db *database.DB) *InsuranceRepository {
	return &InsuranceRepository{db: db}
}

const insuranceColumns = `"id", "userId", "memberId", "insuranceType", "providerName", "policyNumber", "notes", "createdAt"`

func scanInsurance(row pgx.Row) (*entity.Insurance, error) {
	var i entity.Insurance
	err := row.Scan(&i.ID, &i.UserID, &i.MemberID, &i.InsuranceType, &i.ProviderName, &i.PolicyNumber, &i.Notes, &i.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *InsuranceRepository) List(ctx context.Context, userID string) ([]entity.Insurance, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+insuranceColumns+` FROM "Insurance" WHERE "userId"=$1 ORDER BY "createdAt" DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.Insurance, 0)
	for rows.Next() {
		var i entity.Insurance
		if err := rows.Scan(&i.ID, &i.UserID, &i.MemberID, &i.InsuranceType, &i.ProviderName, &i.PolicyNumber, &i.Notes, &i.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, i)
	}
	return list, rows.Err()
}

func (r *InsuranceRepository) FindByID(ctx context.Context, id string) (*entity.Insurance, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+insuranceColumns+` FROM "Insurance" WHERE "id"=$1`, id)
	return scanInsurance(row)
}

func (r *InsuranceRepository) Create(ctx context.Context, in repository.CreateInsuranceInput) (*entity.Insurance, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "Insurance" ("id", "userId", "memberId", "insuranceType", "providerName", "policyNumber", "notes", "createdAt")
		 VALUES ($1,$2,$3,$4,$5,$6,$7, now())
		 RETURNING `+insuranceColumns,
		id, in.UserID, in.MemberID, in.InsuranceType, in.ProviderName, in.PolicyNumber, in.Notes)
	return scanInsurance(row)
}

func (r *InsuranceRepository) Update(ctx context.Context, id string, in repository.UpdateInsuranceInput) (*entity.Insurance, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE "Insurance" SET
			"insuranceType" = COALESCE($2, "insuranceType"),
			"providerName" = COALESCE($3, "providerName"),
			"policyNumber" = COALESCE($4, "policyNumber"),
			"notes" = COALESCE($5, "notes")
		 WHERE "id"=$1
		 RETURNING `+insuranceColumns,
		id, in.InsuranceType, in.ProviderName, in.PolicyNumber, in.Notes)
	return scanInsurance(row)
}

func (r *InsuranceRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM "Insurance" WHERE "id"=$1`, id)
	return err
}
