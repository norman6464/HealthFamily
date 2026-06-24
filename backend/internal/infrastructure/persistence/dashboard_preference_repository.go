package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/lib/pq"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/sqlc/sqlcgen"
	"healthfamily/internal/pkg/auth"
)

// DashboardPreferenceRepository は "DashboardPreference" テーブルのリポジトリ（ユーザー単位の単一行）。
// 検索系(Get)は sqlc、書き込み系(Upsert)は GORM(ON CONFLICT)を使う。
type DashboardPreferenceRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewDashboardPreferenceRepository(db *database.DB) *DashboardPreferenceRepository {
	return &DashboardPreferenceRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func (r *DashboardPreferenceRepository) Get(ctx context.Context, userID string) (*entity.DashboardPreference, error) {
	row, err := r.q.GetDashboardPreference(ctx, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &entity.DashboardPreference{
		UserID:          row.UserId,
		HiddenCards:     row.HiddenCards,
		CardOrder:       row.CardOrder,
		DefaultMemberID: row.DefaultMemberId,
	}, nil
}

func (r *DashboardPreferenceRepository) Upsert(ctx context.Context, userID string, hiddenCards, cardOrder []string, defaultMemberID *string) (*entity.DashboardPreference, error) {
	if hiddenCards == nil {
		hiddenCards = []string{}
	}
	if cardOrder == nil {
		cardOrder = []string{}
	}
	rec := gormDashboardPreference{
		ID:              auth.NewID(),
		UserID:          userID,
		HiddenCards:     pq.StringArray(hiddenCards),
		CardOrder:       pq.StringArray(cardOrder),
		DefaultMemberID: defaultMemberID,
	}
	// CONFLICT 時は EXCLUDED(=今回のINSERT値)で上書き。
	updates := clause.AssignmentColumns([]string{"hiddenCards", "cardOrder", "defaultMemberId"})
	updates = append(updates, clause.Assignment{
		Column: clause.Column{Name: "updatedAt"},
		Value:  gorm.Expr("now()"),
	})
	if err := r.gdb.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "userId"}},
		DoUpdates: updates,
	}).Create(&rec).Error; err != nil {
		return nil, err
	}
	return r.Get(ctx, userID)
}
