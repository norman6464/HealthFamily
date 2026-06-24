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

// TemperatureRecordRepository は "TemperatureRecord" テーブルのリポジトリ。
// 検索系(List/ListByMember/FindByID)は sqlc、書き込み系(Create/Update/Delete)は GORM を使う。
type TemperatureRecordRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewTemperatureRecordRepository(db *database.DB) *TemperatureRecordRepository {
	return &TemperatureRecordRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func temperatureFromSqlc(t sqlcgen.TemperatureRecord) entity.TemperatureRecord {
	return entity.TemperatureRecord{
		ID:          t.ID,
		UserID:      t.UserId,
		MemberID:    t.MemberId,
		Temperature: t.Temperature,
		MeasuredAt:  t.MeasuredAt,
		Notes:       t.Notes,
		CreatedAt:   t.CreatedAt,
	}
}

func (r *TemperatureRecordRepository) List(ctx context.Context, userID string) ([]entity.TemperatureRecord, error) {
	rows, err := r.q.ListTemperatureRecords(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.TemperatureRecord, 0, len(rows))
	for _, t := range rows {
		list = append(list, temperatureFromSqlc(t))
	}
	return list, nil
}

func (r *TemperatureRecordRepository) ListByMember(ctx context.Context, memberID string) ([]entity.TemperatureRecord, error) {
	rows, err := r.q.ListTemperatureRecordsByMember(ctx, memberID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.TemperatureRecord, 0, len(rows))
	for _, t := range rows {
		list = append(list, temperatureFromSqlc(t))
	}
	return list, nil
}

func (r *TemperatureRecordRepository) FindByID(ctx context.Context, id string) (*entity.TemperatureRecord, error) {
	t, err := r.q.GetTemperatureRecord(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := temperatureFromSqlc(t)
	return &e, nil
}

func (r *TemperatureRecordRepository) Create(ctx context.Context, in repository.CreateTemperatureRecordInput) (*entity.TemperatureRecord, error) {
	m := gormTemperatureRecord{
		ID:          auth.NewID(),
		UserID:      in.UserID,
		MemberID:    in.MemberID,
		Temperature: in.Temperature,
		MeasuredAt:  in.MeasuredAt,
		Notes:       in.Notes,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *TemperatureRecordRepository) Update(ctx context.Context, id string, in repository.UpdateTemperatureRecordInput) (*entity.TemperatureRecord, error) {
	fields := map[string]any{}
	if in.Temperature != nil {
		fields["temperature"] = *in.Temperature
	}
	if in.MeasuredAt != nil {
		fields["measuredAt"] = *in.MeasuredAt
	}
	if in.Notes != nil {
		fields["notes"] = *in.Notes
	}
	if len(fields) > 0 {
		if err := r.gdb.WithContext(ctx).Model(&gormTemperatureRecord{}).
			Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(ctx, id)
}

func (r *TemperatureRecordRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormTemperatureRecord{}).Error
}
