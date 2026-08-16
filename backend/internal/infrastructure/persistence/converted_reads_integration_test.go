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
// このパッケージの読み取りテストが使う最小限のデータを用意する。
// 外部で投入されている前提にすると、DB を作り直した瞬間に落ちる。
func seedReadFixtures(t *testing.T, db *database.DB) {
	t.Helper()
	ctx := context.Background()
	stmts := []string{
		`DELETE FROM "User" WHERE "id" = 'u1'`,
		`INSERT INTO "User"("id","email","password") VALUES ('u1','u1@example.test','x')`,
		`INSERT INTO "Member"("id","userId","name") VALUES ('m1','u1','太郎')`,
		`INSERT INTO "Medication"("id","memberId","userId","name","stockQuantity","isActive") VALUES ('med1','m1','u1','薬A',3,true)`,
		`INSERT INTO "MedicationRecord"("id","memberId","medicationId","userId","takenAt") VALUES ('r1','m1','med1','u1',now())`,
		`INSERT INTO "Expense"("id","userId","memberId","category","amount","expenseDate","isDeductible") VALUES ('e1','u1','m1','診察',3000,now(),true)`,
		`INSERT INTO "Prescription"("id","userId","memberId","prescriptionName","prescribedAt") VALUES ('p1','u1','m1','処方箋A',now())`,
		`INSERT INTO "PrescriptionItem"("id","prescriptionId","name","sortOrder") VALUES ('pi1','p1','薬X',1),('pi2','p1','薬Y',2)`,
		`INSERT INTO "Schedule"("id","medicationId","userId","memberId","scheduledTime","isEnabled") VALUES ('s1','med1','u1','m1','08:00',true)`,
	}
	for _, q := range stmts {
		if _, err := db.Pool.Exec(ctx, q); err != nil {
			t.Fatalf("seed (%s): %v", q, err)
		}
	}
	t.Cleanup(func() { _, _ = db.Pool.Exec(context.Background(), `DELETE FROM "User" WHERE "id" = 'u1'`) })
}

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
	seedReadFixtures(t, db)

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

// 後半で置き換えた読み取りも、実DBで期待どおり動くこと。
func TestConverted_sqlc読み取り後半(t *testing.T) {
	if os.Getenv("HF_DB_INTEGRATION") != "1" {
		t.Skip("HF_DB_INTEGRATION=1 以外はスキップ")
	}
	ctx := context.Background()
	db, err := database.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	defer db.Close()
	seedReadFixtures(t, db)

	t.Run("医療費の絞り込み", func(t *testing.T) {
		repo := NewExpenseRepository(db)
		all, err := repo.List(ctx, "u1", repository.ExpenseFilter{})
		if err != nil {
			t.Fatalf("%v", err)
		}
		byMember, _ := repo.List(ctx, "u1", repository.ExpenseFilter{MemberID: "m1"})
		byYear, _ := repo.List(ctx, "u1", repository.ExpenseFilter{Year: 2026})
		miss, _ := repo.List(ctx, "u1", repository.ExpenseFilter{Year: 1999})
		if len(all) != 1 || len(byMember) != 1 || len(byYear) != 1 {
			t.Errorf("絞り込みが効いていない: all=%d member=%d year=%d", len(all), len(byMember), len(byYear))
		}
		if len(miss) != 0 {
			t.Errorf("該当しない年で %d 件返った", len(miss))
		}
	})

	t.Run("医療費の集計", func(t *testing.T) {
		got, err := NewExpenseRepository(db).Summary(ctx, "u1", 2026)
		if err != nil {
			t.Fatalf("%v", err)
		}
		if got.Total != 3000 || got.DeductibleTotal != 3000 {
			t.Errorf("合計がずれている: total=%d deductible=%d", got.Total, got.DeductibleTotal)
		}
		if got.ByCategory["診察"] != 3000 {
			t.Errorf("カテゴリ別がずれている: %+v", got.ByCategory)
		}
		if len(got.ByMonth) != 1 || got.ByMonth[0].Total != 3000 {
			t.Errorf("月別がずれている: %+v", got.ByMonth)
		}
	})

	t.Run("処方箋と明細", func(t *testing.T) {
		got, err := NewPrescriptionRepository(db).List(ctx, "u1")
		if err != nil {
			t.Fatalf("%v", err)
		}
		if len(got) != 1 {
			t.Fatalf("件数 = %d", len(got))
		}
		if len(got[0].Items) != 2 {
			t.Errorf("明細が %d 件。まとめ取得が壊れている", len(got[0].Items))
		}
	})

	t.Run("今日の予定", func(t *testing.T) {
		got, err := NewScheduleRepository(db).GetTodaySchedules(ctx, "u1", time.Now())
		if err != nil {
			t.Fatalf("%v", err)
		}
		if len(got) != 1 {
			t.Fatalf("件数 = %d", len(got))
		}
		if got[0].MedicationName != "薬A" || got[0].MemberName != "太郎" {
			t.Errorf("結合がずれている: %+v", got[0])
		}
	})
}
