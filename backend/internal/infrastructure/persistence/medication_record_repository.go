package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"gorm.io/gorm"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/sqlc/sqlcgen"
	"healthfamily/internal/pkg/auth"
)

// recordColumns は MedicationRecord の列一覧(動的フィルタクエリ aggregate_queries.go で利用)。
const recordColumns = `"id", "memberId", "medicationId", "userId", "scheduleId", "takenAt", "notes", "dosageAmount"`

// MedicationRecordRepository は "MedicationRecord" テーブルのリポジトリ。
// 検索系(ListByUser/ListByMember/FindByID)は sqlc、書き込み系(Create/Delete)は GORM を使う。
// pool は動的フィルタクエリ(ListByUserFiltered, aggregate_queries.go)で生SQLに利用する。
type MedicationRecordRepository struct {
	gdb  *gorm.DB
	q    *sqlcgen.Queries
	pool *pgxpool.Pool
}

func NewMedicationRecordRepository(db *database.DB) *MedicationRecordRepository {
	return &MedicationRecordRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool), pool: db.Pool}
}

func recordFromSqlc(r sqlcgen.MedicationRecord) entity.MedicationRecord {
	return entity.MedicationRecord{
		ID:           r.ID,
		MemberID:     r.MemberId,
		MedicationID: r.MedicationId,
		UserID:       r.UserId,
		ScheduleID:   r.ScheduleId,
		TakenAt:      r.TakenAt,
		Notes:        r.Notes,
		DosageAmount: r.DosageAmount,
	}
}

func (r *MedicationRecordRepository) ListByUser(ctx context.Context, userID string) ([]entity.MedicationRecord, error) {
	rows, err := r.q.ListMedicationRecordsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.MedicationRecord, 0, len(rows))
	for _, rec := range rows {
		list = append(list, recordFromSqlc(rec))
	}
	return list, nil
}

func (r *MedicationRecordRepository) ListByMember(ctx context.Context, memberID string) ([]entity.MedicationRecord, error) {
	rows, err := r.q.ListMedicationRecordsByMember(ctx, memberID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.MedicationRecord, 0, len(rows))
	for _, rec := range rows {
		list = append(list, recordFromSqlc(rec))
	}
	return list, nil
}

func (r *MedicationRecordRepository) FindByID(ctx context.Context, id string) (*entity.MedicationRecord, error) {
	rec, err := r.q.GetMedicationRecord(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := recordFromSqlc(rec)
	return &e, nil
}

func (r *MedicationRecordRepository) Create(ctx context.Context, in repository.CreateRecordInput) (*entity.MedicationRecord, error) {
	m := gormMedicationRecord{
		ID:           auth.NewID(),
		MemberID:     in.MemberID,
		MedicationID: in.MedicationID,
		UserID:       in.UserID,
		ScheduleID:   in.ScheduleID,
		Notes:        in.Notes,
		DosageAmount: in.DosageAmount,
	}
	// 旧実装の takenAt COALESCE(now()) を再現: 未指定なら DB 既定値(now())に委ねる。
	if in.TakenAt != nil {
		m.TakenAt = *in.TakenAt
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *MedicationRecordRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormMedicationRecord{}).Error
}
