package database

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
)

// Migrate は指定ディレクトリ内の .sql ファイルを名前順に実行する。
// 各マイグレーションは IF NOT EXISTS 等で冪等に書かれている前提。
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

	for _, f := range files {
		content, err := os.ReadFile(filepath.Join(dir, f))
		if err != nil {
			return fmt.Errorf("read %s: %w", f, err)
		}
		if _, err := d.Pool.Exec(ctx, string(content)); err != nil {
			return fmt.Errorf("exec %s: %w", f, err)
		}
	}
	return nil
}
