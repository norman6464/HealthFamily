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

// ExaminationRepository は examinations テーブルの生SQL実装
type ExaminationRepository struct {
	db *database.DB
}

func NewExaminationRepository(db *database.DB) *ExaminationRepository {
	return &ExaminationRepository{db: db}
}

const examinationColumns = `id, user_id, member_id, examination_type, examined_at, next_scheduled_date, notes, image_data, created_at`

func scanExamination(row pgx.Row) (*entity.Examination, error) {
	var e entity.Examination
	err := row.Scan(&e.ID, &e.UserID, &e.MemberID, &e.ExaminationType, &e.ExaminedAt, &e.NextScheduledDate, &e.Notes, &e.ImageData, &e.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *ExaminationRepository) List(ctx context.Context, userID string) ([]entity.Examination, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+examinationColumns+` FROM examinations WHERE user_id=$1 ORDER BY examined_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.Examination, 0)
	for rows.Next() {
		var e entity.Examination
		if err := rows.Scan(&e.ID, &e.UserID, &e.MemberID, &e.ExaminationType, &e.ExaminedAt, &e.NextScheduledDate, &e.Notes, &e.ImageData, &e.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, rows.Err()
}

func (r *ExaminationRepository) FindByID(ctx context.Context, id string) (*entity.Examination, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+examinationColumns+` FROM examinations WHERE id=$1`, id)
	return scanExamination(row)
}

func (r *ExaminationRepository) Create(ctx context.Context, in repository.CreateExaminationInput) (*entity.Examination, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO examinations (id, user_id, member_id, examination_type, examined_at, next_scheduled_date, notes, image_data, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
		 RETURNING `+examinationColumns,
		id, in.UserID, in.MemberID, in.ExaminationType, in.ExaminedAt, in.NextScheduledDate, in.Notes, in.ImageData)
	return scanExamination(row)
}

func (r *ExaminationRepository) Update(ctx context.Context, id string, in repository.UpdateExaminationInput) (*entity.Examination, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE examinations SET
			examination_type = COALESCE($2, examination_type),
			examined_at = COALESCE($3, examined_at),
			next_scheduled_date = COALESCE($4, next_scheduled_date),
			notes = COALESCE($5, notes),
			image_data = COALESCE($6, image_data)
		 WHERE id=$1
		 RETURNING `+examinationColumns,
		id, in.ExaminationType, in.ExaminedAt, in.NextScheduledDate, in.Notes, in.ImageData)
	return scanExamination(row)
}

func (r *ExaminationRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM examinations WHERE id=$1`, id)
	return err
}
