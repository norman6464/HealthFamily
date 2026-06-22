package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/pkg/auth"
)

// DashboardPreferenceRepository は "DashboardPreference" テーブルの生SQL実装（ユーザー単位の単一行）
type DashboardPreferenceRepository struct {
	db *database.DB
}

func NewDashboardPreferenceRepository(db *database.DB) *DashboardPreferenceRepository {
	return &DashboardPreferenceRepository{db: db}
}

func (r *DashboardPreferenceRepository) Get(ctx context.Context, userID string) (*entity.DashboardPreference, error) {
	var p entity.DashboardPreference
	err := r.db.Pool.QueryRow(ctx,
		`SELECT "userId", "hiddenCards", "cardOrder", "defaultMemberId" FROM "DashboardPreference" WHERE "userId"=$1`,
		userID).Scan(&p.UserID, &p.HiddenCards, &p.CardOrder, &p.DefaultMemberID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *DashboardPreferenceRepository) Upsert(ctx context.Context, userID string, hiddenCards, cardOrder []string, defaultMemberID *string) (*entity.DashboardPreference, error) {
	if hiddenCards == nil {
		hiddenCards = []string{}
	}
	if cardOrder == nil {
		cardOrder = []string{}
	}
	var p entity.DashboardPreference
	err := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "DashboardPreference" ("id", "userId", "hiddenCards", "cardOrder", "defaultMemberId", "createdAt", "updatedAt")
		 VALUES ($1,$2,$3,$4,$5, now(), now())
		 ON CONFLICT ("userId") DO UPDATE
		   SET "hiddenCards"=EXCLUDED."hiddenCards",
		       "cardOrder"=EXCLUDED."cardOrder",
		       "defaultMemberId"=EXCLUDED."defaultMemberId",
		       "updatedAt"=now()
		 RETURNING "userId", "hiddenCards", "cardOrder", "defaultMemberId"`,
		auth.NewID(), userID, hiddenCards, cardOrder, defaultMemberID).
		Scan(&p.UserID, &p.HiddenCards, &p.CardOrder, &p.DefaultMemberID)
	if err != nil {
		return nil, err
	}
	return &p, nil
}
