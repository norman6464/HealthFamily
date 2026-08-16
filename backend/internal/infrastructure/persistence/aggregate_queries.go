package persistence

import (
	"context"
	"fmt"

	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/sqlc/sqlcgen"
)

// ListByUserFiltered は任意の絞り込み(メンバー/期間/件数上限)で服薬記録を返す。
// 全パラメータ未指定なら ListByUser と同等。ダッシュボード/履歴の期間ウィンドウ取得に使う。
func (r *MedicationRecordRepository) ListByUserFiltered(ctx context.Context, userID string, f repository.RecordFilter) ([]entity.MedicationRecord, error) {
	params := sqlcgen.ListRecordsByUserFilteredParams{
		UserID: userID,
		FromAt: f.From,
		ToAt:   f.To,
	}
	if f.MemberID != "" {
		params.MemberID = &f.MemberID
	}
	if f.Limit > 0 {
		limit := int32(f.Limit)
		params.RowLimit = &limit
	}

	rows, err := r.q.ListRecordsByUserFiltered(ctx, params)
	if err != nil {
		return nil, err
	}
	list := make([]entity.MedicationRecord, 0, len(rows))
	for _, row := range rows {
		list = append(list, entity.MedicationRecord{
			ID:           row.ID,
			MemberID:     row.MemberId,
			MedicationID: row.MedicationId,
			UserID:       row.UserId,
			ScheduleID:   row.ScheduleId,
			TakenAt:      row.TakenAt,
			Notes:        row.Notes,
			DosageAmount: row.DosageAmount,
		})
	}
	return list, nil
}

// ListSummary はメンバーごとの薬数を単一SQL(LEFT JOIN + GROUP BY)で集計して返す(N+1回避)。
func (r *MemberRepository) ListSummary(ctx context.Context, userID string) ([]entity.MemberSummary, error) {
	rows, err := r.q.ListMemberSummaries(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.MemberSummary, 0, len(rows))
	for _, row := range rows {
		list = append(list, entity.MemberSummary{
			Member: entity.Member{
				ID:         row.ID,
				UserID:     row.UserId,
				MemberType: row.MemberType,
				Name:       row.Name,
				PetType:    row.PetType,
				PhotoURL:   row.PhotoUrl,
				BirthDate:  row.BirthDate,
				Notes:      row.Notes,
				CreatedAt:  row.CreatedAt,
				UpdatedAt:  row.UpdatedAt,
			},
			MedicationCount:       int(row.MedicationCount),
			ActiveMedicationCount: int(row.ActiveCount),
		})
	}
	return list, nil
}

// ListAlerts は在庫僅少(残数<=5 もしくは在庫アラート日が7日以内)の有効な薬を返す。
func (r *MedicationRepository) ListAlerts(ctx context.Context, userID string) ([]entity.Medication, error) {
	const lowStockThreshold int32 = 5
	threshold := lowStockThreshold
	rows, err := r.q.ListMedicationAlerts(ctx, sqlcgen.ListMedicationAlertsParams{
		UserId:        userID,
		StockQuantity: &threshold,
	})
	if err != nil {
		return nil, fmt.Errorf("list alerts: %w", err)
	}
	list := make([]entity.Medication, 0, len(rows))
	for _, row := range rows {
		list = append(list, medicationFromSqlc(row))
	}
	return list, nil
}
