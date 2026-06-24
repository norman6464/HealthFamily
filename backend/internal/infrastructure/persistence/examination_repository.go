package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"gorm.io/gorm"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/sqlc/sqlcgen"
	"healthfamily/internal/pkg/auth"
)

// ExaminationRepository は "Examination" テーブルのリポジトリ。
// 検索系(List/FindByID)は sqlc、書き込み系(Create/Update/Delete)は GORM を使う。
type ExaminationRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewExaminationRepository(db *database.DB) *ExaminationRepository {
	return &ExaminationRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func examinationFromSqlc(e sqlcgen.Examination) entity.Examination {
	return entity.Examination{
		ID:                e.ID,
		UserID:            e.UserId,
		MemberID:          e.MemberId,
		ExaminationType:   e.ExaminationType,
		ExaminedAt:        e.ExaminedAt,
		NextScheduledDate: e.NextScheduledDate,
		Notes:             e.Notes,
		ImageData:         e.ImageData,
		CreatedAt:         e.CreatedAt,
	}
}

func (r *ExaminationRepository) List(ctx context.Context, userID string) ([]entity.Examination, error) {
	rows, err := r.q.ListExaminations(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.Examination, 0, len(rows))
	for _, e := range rows {
		list = append(list, examinationFromSqlc(e))
	}
	return list, nil
}

func (r *ExaminationRepository) FindByID(ctx context.Context, id string) (*entity.Examination, error) {
	e, err := r.q.GetExamination(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	ex := examinationFromSqlc(e)
	return &ex, nil
}

func (r *ExaminationRepository) Create(ctx context.Context, in repository.CreateExaminationInput) (*entity.Examination, error) {
	m := gormExamination{
		ID:                auth.NewID(),
		UserID:            in.UserID,
		MemberID:          in.MemberID,
		ExaminationType:   in.ExaminationType,
		ExaminedAt:        in.ExaminedAt,
		NextScheduledDate: in.NextScheduledDate,
		Notes:             in.Notes,
		ImageData:         in.ImageData,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *ExaminationRepository) Update(ctx context.Context, id string, in repository.UpdateExaminationInput) (*entity.Examination, error) {
	fields := map[string]any{}
	if in.ExaminationType != nil {
		fields["examinationType"] = *in.ExaminationType
	}
	if in.ExaminedAt != nil {
		fields["examinedAt"] = *in.ExaminedAt
	}
	if in.NextScheduledDate != nil {
		fields["nextScheduledDate"] = *in.NextScheduledDate
	}
	if in.Notes != nil {
		fields["notes"] = *in.Notes
	}
	if in.ImageData != nil {
		fields["imageData"] = *in.ImageData
	}
	if len(fields) > 0 {
		if err := r.gdb.WithContext(ctx).Model(&gormExamination{}).
			Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(ctx, id)
}

func (r *ExaminationRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormExamination{}).Error
}
