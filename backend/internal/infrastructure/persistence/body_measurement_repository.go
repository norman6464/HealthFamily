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

// BodyMeasurementRepository は body_measurements テーブルの生SQL実装
type BodyMeasurementRepository struct {
	db *database.DB
}

func NewBodyMeasurementRepository(db *database.DB) *BodyMeasurementRepository {
	return &BodyMeasurementRepository{db: db}
}

const bodyMeasurementColumns = `id, user_id, member_id, weight, height, recorded_at, notes, created_at`

func scanBodyMeasurement(row pgx.Row) (*entity.BodyMeasurement, error) {
	var b entity.BodyMeasurement
	err := row.Scan(&b.ID, &b.UserID, &b.MemberID, &b.Weight, &b.Height, &b.RecordedAt, &b.Notes, &b.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BodyMeasurementRepository) List(ctx context.Context, userID string) ([]entity.BodyMeasurement, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+bodyMeasurementColumns+` FROM body_measurements WHERE user_id=$1 ORDER BY recorded_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.BodyMeasurement, 0)
	for rows.Next() {
		var b entity.BodyMeasurement
		if err := rows.Scan(&b.ID, &b.UserID, &b.MemberID, &b.Weight, &b.Height, &b.RecordedAt, &b.Notes, &b.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, b)
	}
	return list, rows.Err()
}

func (r *BodyMeasurementRepository) FindByID(ctx context.Context, id string) (*entity.BodyMeasurement, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+bodyMeasurementColumns+` FROM body_measurements WHERE id=$1`, id)
	return scanBodyMeasurement(row)
}

func (r *BodyMeasurementRepository) Create(ctx context.Context, in repository.CreateBodyMeasurementInput) (*entity.BodyMeasurement, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO body_measurements (id, user_id, member_id, weight, height, recorded_at, notes, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7, now())
		 RETURNING `+bodyMeasurementColumns,
		id, in.UserID, in.MemberID, in.Weight, in.Height, in.RecordedAt, in.Notes)
	return scanBodyMeasurement(row)
}

func (r *BodyMeasurementRepository) Update(ctx context.Context, id string, in repository.UpdateBodyMeasurementInput) (*entity.BodyMeasurement, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE body_measurements SET
			weight = COALESCE($2, weight),
			height = COALESCE($3, height),
			recorded_at = COALESCE($4, recorded_at),
			notes = COALESCE($5, notes)
		 WHERE id=$1
		 RETURNING `+bodyMeasurementColumns,
		id, in.Weight, in.Height, in.RecordedAt, in.Notes)
	return scanBodyMeasurement(row)
}

func (r *BodyMeasurementRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM body_measurements WHERE id=$1`, id)
	return err
}
