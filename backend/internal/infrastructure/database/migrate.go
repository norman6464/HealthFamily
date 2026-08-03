package database

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
)

// migrationLockKey は起動時マイグレーションの advisory lock キー。
// 複数インスタンス同時起動 (Cloud Run のスケールアウト等) で同じ SQL が
// 並列実行されるのを防ぐ。
const migrationLockKey = 823450911

// Migrate は指定ディレクトリ内の .sql ファイルを名前順に実行する。
// 各マイグレーションは IF NOT EXISTS 等で冪等に書かれている前提。
// advisory lock はセッション単位のため、専用コネクションを確保して
// lock 取得〜全 SQL 実行〜unlock を同一コネクション上で行う。
func (d *DB) Migrate(ctx context.Context, dir string) error {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}
	files := make([]string, 0)
	for _, e := range entries {
		if !e.IsDir() && filepath.Ext(e.Name()) == ".sql" {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	conn, err := d.Pool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("acquire migration conn: %w", err)
	}
	defer conn.Release()

	if _, err := conn.Exec(ctx, "SELECT pg_advisory_lock($1)", migrationLockKey); err != nil {
		return fmt.Errorf("acquire migration lock: %w", err)
	}
	defer func() {
		// ctx がキャンセル済みでも unlock は試みる
		_, _ = conn.Exec(context.WithoutCancel(ctx), "SELECT pg_advisory_unlock($1)", migrationLockKey)
	}()

	for _, f := range files {
		content, err := os.ReadFile(filepath.Join(dir, f))
		if err != nil {
			return fmt.Errorf("read %s: %w", f, err)
		}
		if _, err := conn.Exec(ctx, string(content)); err != nil {
			return fmt.Errorf("exec %s: %w", f, err)
		}
	}
	return nil
}
