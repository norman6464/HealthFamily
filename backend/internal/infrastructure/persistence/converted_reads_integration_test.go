package persistence

import (
	"context"
	"os"
	"testing"
	"time"

	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
)

// sqlc へ置き換えた読み取りが、実DBに対して期待どおり動くこと。
func TestConverted_sqlc読み取り(t *testing.T) {
	if os.Getenv("HF_DB_INTEGRATION") != "1" {
		t.Skip("HF_DB_INTEGRATION=1 以外はスキップ")
	}
	ctx := context.Background()
	db, err := database.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	defer db.Close()

	t.Run("メンバー集計", func(t *testing.T) {
		got, err := NewMemberRepository(db).ListSummary(ctx, "u1")
		if err != nil {
			t.Fatalf("%v", err)
		}
		if len(got) != 1 {
			t.Fatalf("件数 = %d, want 1", len(got))
		}
		if got[0].Name != "太郎" || got[0].MedicationCount != 1 || got[0].ActiveMedicationCount != 1 {
			t.Errorf("集計がずれている: %+v", got[0])
		}
	})

	t.Run("在庫アラート", func(t *testing.T) {
		got, err := NewMedicationRepository(db).ListAlerts(ctx, "u1")
		if err != nil {
			t.Fatalf("%v", err)
		}
		if len(got) != 1 || got[0].Name != "薬A" {
			t.Fatalf("残数3の薬が拾えていない: %+v", got)
		}
	})

	repo := NewMedicationRecordRepository(db)

	t.Run("絞り込みなし", func(t *testing.T) {
		got, err := repo.ListByUserFiltered(ctx, "u1", repository.RecordFilter{})
		if err != nil || len(got) != 1 {
			t.Fatalf("件数 = %d, err = %v", len(got), err)
		}
	})

	t.Run("メンバーで絞る", func(t *testing.T) {
		hit, _ := repo.ListByUserFiltered(ctx, "u1", repository.RecordFilter{MemberID: "m1"})
		miss, _ := repo.ListByUserFiltered(ctx, "u1", repository.RecordFilter{MemberID: "nope"})
		if len(hit) != 1 || len(miss) != 0 {
			t.Errorf("絞り込みが効いていない: hit=%d miss=%d", len(hit), len(miss))
		}
	})

	t.Run("期間で絞る", func(t *testing.T) {
		past := time.Now().Add(-time.Hour)
		future := time.Now().Add(time.Hour)
		in, _ := repo.ListByUserFiltered(ctx, "u1", repository.RecordFilter{From: &past, To: &future})
		out, _ := repo.ListByUserFiltered(ctx, "u1", repository.RecordFilter{From: &future})
		if len(in) != 1 || len(out) != 0 {
			t.Errorf("期間が効いていない: in=%d out=%d", len(in), len(out))
		}
	})

	t.Run("件数上限", func(t *testing.T) {
		zero, _ := repo.ListByUserFiltered(ctx, "u1", repository.RecordFilter{Limit: 0})
		one, _ := repo.ListByUserFiltered(ctx, "u1", repository.RecordFilter{Limit: 1})
		if len(zero) != 1 {
			t.Errorf("Limit 0 は無制限のはず: %d", len(zero))
		}
		if len(one) != 1 {
			t.Errorf("Limit 1: %d", len(one))
		}
	})
}
