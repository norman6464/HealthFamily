package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/lib/pq"
	"gorm.io/gorm"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/sqlc/sqlcgen"
	"healthfamily/internal/pkg/auth"
)

// HealthLogRepository は "HealthLog" テーブルのリポジトリ。
// 検索系(List/FindByID)は sqlc、書き込み系(Create/Update/Delete)は GORM を使う。
type HealthLogRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewHealthLogRepository(db *database.DB) *HealthLogRepository {
	return &HealthLogRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func healthLogFromSqlc(h sqlcgen.HealthLog) entity.HealthLog {
	return entity.HealthLog{
		ID:             h.ID,
		UserID:         h.UserId,
		MemberID:       h.MemberId,
		ConditionLevel: int(h.ConditionLevel),
		Symptoms:       h.Symptoms,
		Notes:          h.Notes,
		RecordedAt:     h.RecordedAt,
	}
}

func (r *HealthLogRepository) List(ctx context.Context, userID string) ([]entity.HealthLog, error) {
	rows, err := r.q.ListHealthLogs(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.HealthLog, 0, len(rows))
	for _, h := range rows {
		list = append(list, healthLogFromSqlc(h))
	}
	return list, nil
}

func (r *HealthLogRepository) FindByID(ctx context.Context, id string) (*entity.HealthLog, error) {
	h, err := r.q.GetHealthLog(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := healthLogFromSqlc(h)
	return &e, nil
}

func (r *HealthLogRepository) Create(ctx context.Context, in repository.CreateHealthLogInput) (*entity.HealthLog, error) {
	symptoms := in.Symptoms
	if symptoms == nil {
		symptoms = []string{} // NOT NULL 列のため空配列に正規化
	}
	m := gormHealthLog{
		ID:             auth.NewID(),
		UserID:         in.UserID,
		MemberID:       in.MemberID,
		ConditionLevel: in.ConditionLevel,
		Symptoms:       pq.StringArray(symptoms),
		Notes:          in.Notes,
	}
	// recordedAt 未指定なら DB 既定値(now())。
	if in.RecordedAt != nil {
		m.RecordedAt = *in.RecordedAt
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *HealthLogRepository) Update(ctx context.Context, id string, in repository.UpdateHealthLogInput) (*entity.HealthLog, error) {
	fields := map[string]any{}
	if in.ConditionLevel != nil {
		fields["conditionLevel"] = *in.ConditionLevel
	}
	if in.Symptoms != nil {
		fields["symptoms"] = pq.StringArray(in.Symptoms)
	}
	if in.Notes != nil {
		fields["notes"] = *in.Notes
	}
	if in.RecordedAt != nil {
		fields["recordedAt"] = *in.RecordedAt
	}
	if len(fields) > 0 {
		if err := r.gdb.WithContext(ctx).Model(&gormHealthLog{}).
			Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(ctx, id)
}

func (r *HealthLogRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormHealthLog{}).Error
}
