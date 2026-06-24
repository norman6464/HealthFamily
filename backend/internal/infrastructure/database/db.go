package database

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// DB はDB接続をラップする。
//   - Pool: pgxpool。検索系(sqlc)で利用（パフォーマンス重視）。
//   - Gorm: GORM。挿入・更新・削除系で利用（セキュリティ重視）。
type DB struct {
	Pool *pgxpool.Pool
	Gorm *gorm.DB
}

// New はDATABASE_URLからコネクションプールを生成する
func New(ctx context.Context, databaseURL string) (*DB, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	// クロスリージョン(API:Singapore ↔ DB:Sydney)のため、接続確立コスト(TLS往復)を
	// リクエスト毎に払わないよう常時ウォーム接続を維持する。
	cfg.MaxConns = 10
	cfg.MinConns = 2                        // 最低2本を常時オープン
	cfg.MaxConnIdleTime = 30 * time.Minute  // アイドルでもすぐ閉じない
	cfg.MaxConnLifetime = 1 * time.Hour     // 長寿命接続を再利用
	cfg.HealthCheckPeriod = 1 * time.Minute // アイドル接続を定期検査してウォーム維持

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, err
	}

	pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, err
	}

	// GORM（書き込み系で利用）。同一 DATABASE_URL に別接続プールを張る。
	gdb, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		// SQL ログは抑制（必要時に Info へ）。SkipDefaultTransaction で単発書き込みを軽量化。
		Logger:                 gormlogger.Default.LogMode(gormlogger.Silent),
		SkipDefaultTransaction: true,
	})
	if err != nil {
		pool.Close()
		return nil, err
	}
	sqlDB, err := gdb.DB()
	if err != nil {
		pool.Close()
		return nil, err
	}
	// 書き込みは頻度が低いため控えめなプール。クロスリージョンでも数本はウォーム維持。
	sqlDB.SetMaxOpenConns(5)
	sqlDB.SetMaxIdleConns(2)
	sqlDB.SetConnMaxIdleTime(30 * time.Minute)
	sqlDB.SetConnMaxLifetime(1 * time.Hour)

	return &DB{Pool: pool, Gorm: gdb}, nil
}

// Close はプールを閉じる
func (d *DB) Close() {
	if d.Pool != nil {
		d.Pool.Close()
	}
	if d.Gorm != nil {
		if sqlDB, err := d.Gorm.DB(); err == nil {
			_ = sqlDB.Close()
		}
	}
}
