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

// TemperatureRecordRepository は temperature_records テーブルの生SQL実装
type TemperatureRecordRepository struct {
	db *database.DB
}

func NewTemperatureRecordRepository(db *database.DB) *TemperatureRecordRepository {
	return &TemperatureRecordRepository{db: db}
}

const temperatureColumns = `id, user_id, member_id, temperature, measured_at, notes, created_at`

func scanTemperature(row pgx.Row) (*entity.TemperatureRecord, error) {
	var t entity.TemperatureRecord
	err := row.Scan(&t.ID, &t.UserID, &t.MemberID, &t.Temperature, &t.MeasuredAt, &t.Notes, &t.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TemperatureRecordRepository) queryList(ctx context.Context, where, arg string) ([]entity.TemperatureRecord, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+temperatureColumns+` FROM temperature_records WHERE `+where+` ORDER BY measured_at DESC`, arg)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.TemperatureRecord, 0)
	for rows.Next() {
		var t entity.TemperatureRecord
		if err := rows.Scan(&t.ID, &t.UserID, &t.MemberID, &t.Temperature, &t.MeasuredAt, &t.Notes, &t.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, rows.Err()
}

func (r *TemperatureRecordRepository) List(ctx context.Context, userID string) ([]entity.TemperatureRecord, error) {
	return r.queryList(ctx, "user_id=$1", userID)
}

func (r *TemperatureRecordRepository) ListByMember(ctx context.Context, memberID string) ([]entity.TemperatureRecord, error) {
	return r.queryList(ctx, "member_id=$1", memberID)
}

func (r *TemperatureRecordRepository) FindByID(ctx context.Context, id string) (*entity.TemperatureRecord, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+temperatureColumns+` FROM temperature_records WHERE id=$1`, id)
	return scanTemperature(row)
}

func (r *TemperatureRecordRepository) Create(ctx context.Context, in repository.CreateTemperatureRecordInput) (*entity.TemperatureRecord, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO temperature_records (id, user_id, member_id, temperature, measured_at, notes, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6, now())
		 RETURNING `+temperatureColumns,
		id, in.UserID, in.MemberID, in.Temperature, in.MeasuredAt, in.Notes)
	return scanTemperature(row)
}

func (r *TemperatureRecordRepository) Update(ctx context.Context, id string, in repository.UpdateTemperatureRecordInput) (*entity.TemperatureRecord, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE temperature_records SET
			temperature = COALESCE($2, temperature),
			measured_at = COALESCE($3, measured_at),
			notes = COALESCE($4, notes)
		 WHERE id=$1
		 RETURNING `+temperatureColumns,
		id, in.Temperature, in.MeasuredAt, in.Notes)
	return scanTemperature(row)
}

func (r *TemperatureRecordRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM temperature_records WHERE id=$1`, id)
	return err
}
