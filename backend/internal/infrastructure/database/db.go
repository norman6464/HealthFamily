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
	cfg.MaxConns = 10
	cfg.MaxConnIdleTime = 5 * time.Minute

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
