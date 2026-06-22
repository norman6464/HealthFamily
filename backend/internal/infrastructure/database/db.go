package database

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB はコネクションプールをラップする。生SQLでの操作前提。
type DB struct {
	Pool *pgxpool.Pool
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

	return &DB{Pool: pool}, nil
}

// Close はプールを閉じる
func (d *DB) Close() {
	if d.Pool != nil {
		d.Pool.Close()
	}
}
