package persistence

import (
	"context"
	"os"
	"testing"

	"healthfamily/internal/infrastructure/database"

	"github.com/lib/pq"
)

// TestGormArrayWrite は GORM(pgx stdlib 経由)で []string を text[] 列へ書き込めることを
// 実DBに対して検証する。一時テーブル + ロールバックで本番データに影響を与えない。
// 既定ではスキップ。実行するには HF_DB_INTEGRATION=1 と DATABASE_URL を設定する。
func TestGormArrayWrite(t *testing.T) {
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

	type arrRow struct {
		ID   string         `gorm:"column:id;primaryKey"`
		Vals pq.StringArray `gorm:"column:vals;type:text[]"`
	}

	tx := db.Gorm.WithContext(ctx).Begin()
	if tx.Error != nil {
		t.Fatalf("begin: %v", tx.Error)
	}
	defer tx.Rollback()

	if err := tx.Exec(`CREATE TEMP TABLE arr_write_probe (id text primary key, vals text[] not null) ON COMMIT DROP`).Error; err != nil {
		t.Fatalf("create temp: %v", err)
	}
	if err := tx.Table("arr_write_probe").Create(&arrRow{ID: "x1", Vals: pq.StringArray{"mon", "wed", "fri"}}).Error; err != nil {
		t.Fatalf("gorm array insert failed: %v", err)
	}
	// 空配列(NOT NULL)も書けること
	if err := tx.Table("arr_write_probe").Create(&arrRow{ID: "x2", Vals: pq.StringArray{}}).Error; err != nil {
		t.Fatalf("gorm empty array insert failed: %v", err)
	}

	// Updates(map) 経路でも Valuer がタプル展開されず配列として書けること
	if err := tx.Table("arr_write_probe").Where("id = ?", "x1").
		Updates(map[string]any{"vals": pq.StringArray{"sat", "sun"}}).Error; err != nil {
		t.Fatalf("gorm array update(map) failed: %v", err)
	}

	var got arrRow
	if err := tx.Table("arr_write_probe").Where("id = ?", "x1").First(&got).Error; err != nil {
		t.Fatalf("read back: %v", err)
	}
	if len(got.Vals) != 2 || got.Vals[0] != "sat" || got.Vals[1] != "sun" {
		t.Fatalf("update round-trip mismatch: %#v", got.Vals)
	}
	t.Logf("OK: GORM array create+update round-trip = %v", got.Vals)
}
