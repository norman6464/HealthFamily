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

// HealthLogRepository は health_logs テーブルの生SQL実装
type HealthLogRepository struct {
	db *database.DB
}

func NewHealthLogRepository(db *database.DB) *HealthLogRepository {
	return &HealthLogRepository{db: db}
}

const healthLogColumns = `id, user_id, member_id, condition_level, symptoms, notes, recorded_at`

func scanHealthLog(row pgx.Row) (*entity.HealthLog, error) {
	var h entity.HealthLog
	err := row.Scan(&h.ID, &h.UserID, &h.MemberID, &h.ConditionLevel, &h.Symptoms, &h.Notes, &h.RecordedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *HealthLogRepository) List(ctx context.Context, userID string) ([]entity.HealthLog, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+healthLogColumns+` FROM health_logs WHERE user_id=$1 ORDER BY recorded_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.HealthLog, 0)
	for rows.Next() {
		var h entity.HealthLog
		if err := rows.Scan(&h.ID, &h.UserID, &h.MemberID, &h.ConditionLevel, &h.Symptoms, &h.Notes, &h.RecordedAt); err != nil {
			return nil, err
		}
		list = append(list, h)
	}
	return list, rows.Err()
}

func (r *HealthLogRepository) FindByID(ctx context.Context, id string) (*entity.HealthLog, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+healthLogColumns+` FROM health_logs WHERE id=$1`, id)
	return scanHealthLog(row)
}

func (r *HealthLogRepository) Create(ctx context.Context, in repository.CreateHealthLogInput) (*entity.HealthLog, error) {
	id := auth.NewID()
	symptoms := in.Symptoms
	if symptoms == nil {
		symptoms = []string{}
	}
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO health_logs (id, user_id, member_id, condition_level, symptoms, notes, recorded_at)
		 VALUES ($1,$2,$3,$4,$5,$6, COALESCE($7, now()))
		 RETURNING `+healthLogColumns,
		id, in.UserID, in.MemberID, in.ConditionLevel, symptoms, in.Notes, in.RecordedAt)
	return scanHealthLog(row)
}

func (r *HealthLogRepository) Update(ctx context.Context, id string, in repository.UpdateHealthLogInput) (*entity.HealthLog, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE health_logs SET
			condition_level = COALESCE($2, condition_level),
			symptoms = COALESCE($3, symptoms),
			notes = COALESCE($4, notes),
			recorded_at = COALESCE($5, recorded_at)
		 WHERE id=$1
		 RETURNING `+healthLogColumns,
		id, in.ConditionLevel, in.Symptoms, in.Notes, in.RecordedAt)
	return scanHealthLog(row)
}

func (r *HealthLogRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM health_logs WHERE id=$1`, id)
	return err
}
