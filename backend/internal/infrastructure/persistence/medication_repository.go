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

// MedicationRepository は "Medication" テーブルの生SQL実装
type MedicationRepository struct {
	db *database.DB
}

func NewMedicationRepository(db *database.DB) *MedicationRepository {
	return &MedicationRepository{db: db}
}

const medColumns = `"id", "memberId", "userId", "name", "category", "dosageAmount", "frequency",
	"stockQuantity", "stockAlertDate", "intervalHours", "instructions", "displayOrder",
	"isActive", "status", "createdAt", "updatedAt"`

func scanMedication(row pgx.Row) (*entity.Medication, error) {
	var m entity.Medication
	err := row.Scan(&m.ID, &m.MemberID, &m.UserID, &m.Name, &m.Category, &m.DosageAmount,
		&m.Frequency, &m.StockQuantity, &m.StockAlertDate, &m.IntervalHours, &m.Instructions,
		&m.DisplayOrder, &m.IsActive, &m.Status, &m.CreatedAt, &m.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MedicationRepository) queryList(ctx context.Context, where string, arg string) ([]entity.Medication, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+medColumns+` FROM "Medication" WHERE `+where+` ORDER BY "displayOrder" ASC, "createdAt" ASC`, arg)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.Medication, 0)
	for rows.Next() {
		var m entity.Medication
		if err := rows.Scan(&m.ID, &m.MemberID, &m.UserID, &m.Name, &m.Category, &m.DosageAmount,
			&m.Frequency, &m.StockQuantity, &m.StockAlertDate, &m.IntervalHours, &m.Instructions,
			&m.DisplayOrder, &m.IsActive, &m.Status, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, rows.Err()
}

func (r *MedicationRepository) ListByMember(ctx context.Context, memberID string) ([]entity.Medication, error) {
	return r.queryList(ctx, `"memberId"=$1`, memberID)
}

func (r *MedicationRepository) ListByUser(ctx context.Context, userID string) ([]entity.Medication, error) {
	return r.queryList(ctx, `"userId"=$1`, userID)
}

func (r *MedicationRepository) FindByID(ctx context.Context, id string) (*entity.Medication, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+medColumns+` FROM "Medication" WHERE "id"=$1`, id)
	return scanMedication(row)
}

func (r *MedicationRepository) Create(ctx context.Context, in repository.CreateMedicationInput) (*entity.Medication, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "Medication" ("id", "memberId", "userId", "name", "category", "dosageAmount", "frequency",
			"stockQuantity", "stockAlertDate", "instructions", "createdAt", "updatedAt")
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now(), now())
		 RETURNING `+medColumns,
		id, in.MemberID, in.UserID, in.Name, in.Category, in.DosageAmount, in.Frequency,
		in.StockQuantity, in.StockAlertDate, in.Instructions)
	return scanMedication(row)
}

func (r *MedicationRepository) Update(ctx context.Context, id string, in repository.UpdateMedicationInput) (*entity.Medication, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE "Medication" SET
			"name" = COALESCE($2, "name"),
			"category" = COALESCE($3, "category"),
			"dosageAmount" = COALESCE($4, "dosageAmount"),
			"frequency" = COALESCE($5, "frequency"),
			"stockQuantity" = COALESCE($6, "stockQuantity"),
			"stockAlertDate" = COALESCE($7, "stockAlertDate"),
			"instructions" = COALESCE($8, "instructions"),
			"isActive" = COALESCE($9, "isActive"),
			"status" = COALESCE($10, "status"),
			"updatedAt" = now()
		 WHERE "id"=$1
		 RETURNING `+medColumns,
		id, in.Name, in.Category, in.DosageAmount, in.Frequency, in.StockQuantity,
		in.StockAlertDate, in.Instructions, in.IsActive, in.Status)
	return scanMedication(row)
}

func (r *MedicationRepository) UpdateStock(ctx context.Context, id string, quantity int) (*entity.Medication, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE "Medication" SET "stockQuantity"=$2, "updatedAt"=now() WHERE "id"=$1 RETURNING `+medColumns,
		id, quantity)
	return scanMedication(row)
}

func (r *MedicationRepository) Reorder(ctx context.Context, userID string, orderedIDs []string) error {
	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	for i, id := range orderedIDs {
		if _, err := tx.Exec(ctx,
			`UPDATE "Medication" SET "displayOrder"=$1, "updatedAt"=now() WHERE "id"=$2 AND "userId"=$3`,
			i, id, userID); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (r *MedicationRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM "Medication" WHERE "id"=$1`, id)
	return err
}
