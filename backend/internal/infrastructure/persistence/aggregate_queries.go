package persistence

import (
	"context"
	"fmt"
	"strconv"

	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// ListByUserFiltered は任意の絞り込み(メンバー/期間/件数上限)で服薬記録を返す。
// 全パラメータ未指定なら ListByUser と同等。ダッシュボード/履歴の期間ウィンドウ取得に使う。
func (r *MedicationRecordRepository) ListByUserFiltered(ctx context.Context, userID string, f repository.RecordFilter) ([]entity.MedicationRecord, error) {
	query := `SELECT ` + recordColumns + ` FROM "MedicationRecord" WHERE "userId"=$1`
	args := []any{userID}
	n := 1
	if f.MemberID != "" {
		n++
		query += ` AND "memberId"=$` + strconv.Itoa(n)
		args = append(args, f.MemberID)
	}
	if f.From != nil {
		n++
		query += ` AND "takenAt" >= $` + strconv.Itoa(n)
		args = append(args, *f.From)
	}
	if f.To != nil {
		n++
		query += ` AND "takenAt" < $` + strconv.Itoa(n)
		args = append(args, *f.To)
	}
	query += ` ORDER BY "takenAt" DESC`
	if f.Limit > 0 {
		query += ` LIMIT ` + strconv.Itoa(f.Limit)
	}

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.MedicationRecord, 0)
	for rows.Next() {
		var rec entity.MedicationRecord
		if err := rows.Scan(&rec.ID, &rec.MemberID, &rec.MedicationID, &rec.UserID, &rec.ScheduleID,
			&rec.TakenAt, &rec.Notes, &rec.DosageAmount); err != nil {
			return nil, err
		}
		list = append(list, rec)
	}
	return list, rows.Err()
}

// ListSummary はメンバーごとの薬数を単一SQL(LEFT JOIN + GROUP BY)で集計して返す(N+1回避)。
func (r *MemberRepository) ListSummary(ctx context.Context, userID string) ([]entity.MemberSummary, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT m."id", m."userId", m."memberType", m."name", m."petType", m."photoUrl",
			m."birthDate", m."notes", m."createdAt", m."updatedAt",
			COUNT(med."id") AS medication_count,
			COUNT(med."id") FILTER (WHERE med."isActive") AS active_count
		 FROM "Member" m
		 LEFT JOIN "Medication" med ON med."memberId" = m."id"
		 WHERE m."userId" = $1
		 GROUP BY m."id"
		 ORDER BY m."createdAt" ASC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.MemberSummary, 0)
	for rows.Next() {
		var s entity.MemberSummary
		if err := rows.Scan(&s.ID, &s.UserID, &s.MemberType, &s.Name, &s.PetType, &s.PhotoURL,
			&s.BirthDate, &s.Notes, &s.CreatedAt, &s.UpdatedAt,
			&s.MedicationCount, &s.ActiveMedicationCount); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, rows.Err()
}

// ListAlerts は在庫僅少(残数<=5 もしくは在庫アラート日が7日以内)の有効な薬を返す。
func (r *MedicationRepository) ListAlerts(ctx context.Context, userID string) ([]entity.Medication, error) {
	const lowStockThreshold = 5
	query := `SELECT ` + medColumns + ` FROM "Medication"
		 WHERE "userId"=$1 AND "isActive" = TRUE
		   AND (
		     ("stockQuantity" IS NOT NULL AND "stockQuantity" <= $2)
		     OR ("stockAlertDate" IS NOT NULL AND "stockAlertDate" <= now() + interval '7 days')
		   )
		 ORDER BY "stockQuantity" ASC NULLS LAST, "createdAt" ASC`
	rows, err := r.pool.Query(ctx, query, userID, lowStockThreshold)
	if err != nil {
		return nil, fmt.Errorf("list alerts: %w", err)
	}
	defer rows.Close()
	list := make([]entity.Medication, 0)
	for rows.Next() {
		var m entity.Medication
		if err := rows.Scan(&m.ID, &m.MemberID, &m.UserID, &m.Name, &m.Category, &m.DosageAmount,
			&m.Frequency, &m.StockQuantity, &m.StockAlertDate, &m.IntervalHours, &m.Instructions,
			&m.DisplayOrder, &m.IsActive, &m.Status, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, rows.Err()
}
