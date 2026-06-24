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

// BodyMeasurementRepository は "BodyMeasurement" テーブルのリポジトリ。
// 検索系(List/FindByID)は sqlc、書き込み系(Create/Update/Delete)は GORM を使う。
type BodyMeasurementRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewBodyMeasurementRepository(db *database.DB) *BodyMeasurementRepository {
	return &BodyMeasurementRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func bodyMeasurementFromSqlc(b sqlcgen.BodyMeasurement) entity.BodyMeasurement {
	return entity.BodyMeasurement{
		ID:         b.ID,
		UserID:     b.UserId,
		MemberID:   b.MemberId,
		Weight:     b.Weight,
		Height:     b.Height,
		RecordedAt: b.RecordedAt,
		Notes:      b.Notes,
		CreatedAt:  b.CreatedAt,
	}
}

func (r *BodyMeasurementRepository) List(ctx context.Context, userID string) ([]entity.BodyMeasurement, error) {
	rows, err := r.q.ListBodyMeasurements(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.BodyMeasurement, 0, len(rows))
	for _, b := range rows {
		list = append(list, bodyMeasurementFromSqlc(b))
	}
	return list, nil
}

func (r *BodyMeasurementRepository) FindByID(ctx context.Context, id string) (*entity.BodyMeasurement, error) {
	b, err := r.q.GetBodyMeasurement(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := bodyMeasurementFromSqlc(b)
	return &e, nil
}

func (r *BodyMeasurementRepository) Create(ctx context.Context, in repository.CreateBodyMeasurementInput) (*entity.BodyMeasurement, error) {
	m := gormBodyMeasurement{
		ID:         auth.NewID(),
		UserID:     in.UserID,
		MemberID:   in.MemberID,
		Weight:     in.Weight,
		Height:     in.Height,
		RecordedAt: in.RecordedAt,
		Notes:      in.Notes,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *BodyMeasurementRepository) Update(ctx context.Context, id string, in repository.UpdateBodyMeasurementInput) (*entity.BodyMeasurement, error) {
	fields := map[string]any{}
	if in.Weight != nil {
		fields["weight"] = *in.Weight
	}
	if in.Height != nil {
		fields["height"] = *in.Height
	}
	if in.RecordedAt != nil {
		fields["recordedAt"] = *in.RecordedAt
	}
	if in.Notes != nil {
		fields["notes"] = *in.Notes
	}
	if len(fields) > 0 {
		if err := r.gdb.WithContext(ctx).Model(&gormBodyMeasurement{}).
			Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(ctx, id)
}

func (r *BodyMeasurementRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormBodyMeasurement{}).Error
}
