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

// ExaminationRepository は "Examination" テーブルの生SQL実装
type ExaminationRepository struct {
	db *database.DB
}

func NewExaminationRepository(db *database.DB) *ExaminationRepository {
	return &ExaminationRepository{db: db}
}

const examinationColumns = `"id", "userId", "memberId", "examinationType", "examinedAt", "nextScheduledDate", "notes", "imageData", "createdAt"`

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
		`SELECT `+examinationColumns+` FROM "Examination" WHERE "userId"=$1 ORDER BY "examinedAt" DESC`, userID)
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
	row := r.db.Pool.QueryRow(ctx, `SELECT `+examinationColumns+` FROM "Examination" WHERE "id"=$1`, id)
	return scanExamination(row)
}

func (r *ExaminationRepository) Create(ctx context.Context, in repository.CreateExaminationInput) (*entity.Examination, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "Examination" ("id", "userId", "memberId", "examinationType", "examinedAt", "nextScheduledDate", "notes", "imageData", "createdAt")
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
		 RETURNING `+examinationColumns,
		id, in.UserID, in.MemberID, in.ExaminationType, in.ExaminedAt, in.NextScheduledDate, in.Notes, in.ImageData)
	return scanExamination(row)
}

func (r *ExaminationRepository) Update(ctx context.Context, id string, in repository.UpdateExaminationInput) (*entity.Examination, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE "Examination" SET
			"examinationType" = COALESCE($2, "examinationType"),
			"examinedAt" = COALESCE($3, "examinedAt"),
			"nextScheduledDate" = COALESCE($4, "nextScheduledDate"),
			"notes" = COALESCE($5, "notes"),
			"imageData" = COALESCE($6, "imageData")
		 WHERE "id"=$1
		 RETURNING `+examinationColumns,
		id, in.ExaminationType, in.ExaminedAt, in.NextScheduledDate, in.Notes, in.ImageData)
	return scanExamination(row)
}

func (r *ExaminationRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM "Examination" WHERE "id"=$1`, id)
	return err
}
