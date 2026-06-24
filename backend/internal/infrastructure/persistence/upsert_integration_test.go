package persistence

import (
	"context"
	"os"
	"testing"

	"github.com/lib/pq"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"healthfamily/internal/infrastructure/database"
)

// TestGormOnConflictUpsert は GORM の ON CONFLICT(upsert) が
// (1) EXCLUDED 上書き(配列含む) と (2) 部分更新(指定列のみ) を正しく行うことを
// 実DBの一時テーブルに対して検証する。本番データには影響しない。
// HF_DB_INTEGRATION=1 と DATABASE_URL が必要。
func TestGormOnConflictUpsert(t *testing.T) {
	if os.Getenv("HF_DB_INTEGRATION") != "1" {
		t.Skip("HF_DB_INTEGRATION=1 以外はスキップ")
	}
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		t.Fatal("DATABASE_URL が必要です")
	}
	ctx := context.Background()
	db, err := database.New(ctx, url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	defer db.Close()

	tx := db.Gorm.WithContext(ctx).Begin()
	if tx.Error != nil {
		t.Fatalf("begin: %v", tx.Error)
	}
	defer tx.Rollback()

	// --- (1) dashboard 風: EXCLUDED 上書き(配列) ---
	if err := tx.Exec(`CREATE TEMP TABLE dp_probe (
		id text primary key, "userId" text unique not null,
		"hiddenCards" text[] not null default '{}', "cardOrder" text[] not null default '{}',
		"defaultMemberId" text, "updatedAt" timestamptz not null default now()
	) ON COMMIT DROP`).Error; err != nil {
		t.Fatalf("create dp_probe: %v", err)
	}
	type dp struct {
		ID          string         `gorm:"column:id;primaryKey"`
		UserID      string         `gorm:"column:userId"`
		HiddenCards pq.StringArray `gorm:"column:hiddenCards;type:text[]"`
		CardOrder   pq.StringArray `gorm:"column:cardOrder;type:text[]"`
	}
	dpUpsert := func(userID string, hidden []string) error {
		rec := dp{ID: userID + "-id", UserID: userID, HiddenCards: pq.StringArray(hidden), CardOrder: pq.StringArray{}}
		updates := clause.AssignmentColumns([]string{"hiddenCards", "cardOrder", "defaultMemberId"})
		updates = append(updates, clause.Assignment{Column: clause.Column{Name: "updatedAt"}, Value: gorm.Expr("now()")})
		return tx.Table("dp_probe").Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "userId"}}, DoUpdates: updates,
		}).Create(&rec).Error
	}
	if err := dpUpsert("u1", []string{"a"}); err != nil {
		t.Fatalf("dp insert: %v", err)
	}
	if err := dpUpsert("u1", []string{"b", "c"}); err != nil {
		t.Fatalf("dp conflict update: %v", err)
	}
	var gotDP dp
	if err := tx.Table("dp_probe").Where(`"userId" = ?`, "u1").First(&gotDP).Error; err != nil {
		t.Fatalf("dp read: %v", err)
	}
	if len(gotDP.HiddenCards) != 2 || gotDP.HiddenCards[0] != "b" {
		t.Fatalf("dp EXCLUDED overwrite mismatch: %#v", gotDP.HiddenCards)
	}

	// --- (2) notification 風: 部分更新(指定列のみ、未指定は維持) ---
	if err := tx.Exec(`CREATE TEMP TABLE ns_probe (
		id text primary key, "userId" text unique not null,
		"a" boolean not null default true, "b" boolean not null default true,
		"updatedAt" timestamptz not null default now()
	) ON COMMIT DROP`).Error; err != nil {
		t.Fatalf("create ns_probe: %v", err)
	}
	type ns struct {
		ID     string `gorm:"column:id;primaryKey"`
		UserID string `gorm:"column:userId"`
		A      bool   `gorm:"column:a"`
		B      bool   `gorm:"column:b"`
	}
	// 初回: a=false, b=false で挿入
	rec := ns{ID: "n1", UserID: "u1", A: false, B: false}
	if err := tx.Table("ns_probe").Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "userId"}},
		DoUpdates: clause.Assignments(map[string]any{"updatedAt": gorm.Expr("now()"), "a": false, "b": false}),
	}).Create(&rec).Error; err != nil {
		t.Fatalf("ns insert: %v", err)
	}
	// 競合更新: a のみ true に。b は対象外(維持されるべき)
	rec2 := ns{ID: "n1", UserID: "u1", A: true, B: true}
	if err := tx.Table("ns_probe").Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "userId"}},
		DoUpdates: clause.Assignments(map[string]any{"updatedAt": gorm.Expr("now()"), "a": true}),
	}).Create(&rec2).Error; err != nil {
		t.Fatalf("ns conflict update: %v", err)
	}
	var gotNS ns
	if err := tx.Table("ns_probe").Where(`"userId" = ?`, "u1").First(&gotNS).Error; err != nil {
		t.Fatalf("ns read: %v", err)
	}
	if gotNS.A != true || gotNS.B != false {
		t.Fatalf("ns partial update mismatch: a=%v b=%v (want a=true b=false)", gotNS.A, gotNS.B)
	}
	t.Logf("OK: upsert EXCLUDED=%v / partial a=%v b=%v", gotDP.HiddenCards, gotNS.A, gotNS.B)
}
