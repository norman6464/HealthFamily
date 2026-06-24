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

// medColumns は Medication の列一覧(在庫アラート集計 aggregate_queries.go で利用)。
const medColumns = `"id", "memberId", "userId", "name", "category", "dosageAmount", "frequency",
	"stockQuantity", "stockAlertDate", "intervalHours", "instructions", "displayOrder",
	"isActive", "status", "createdAt", "updatedAt"`

// MedicationRepository は "Medication" テーブルのリポジトリ。
// 検索系(ListByMember/ListByUser/FindByID)は sqlc、書き込み系(Create/Update/UpdateStock/Reorder/Delete)は GORM。
// pool は在庫アラート集計(ListAlerts, aggregate_queries.go)で生SQLに利用する。
type MedicationRepository struct {
	gdb  *gorm.DB
	q    *sqlcgen.Queries
	pool *pgxpool.Pool
}

func NewMedicationRepository(db *database.DB) *MedicationRepository {
	return &MedicationRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool), pool: db.Pool}
}

func medicationFromSqlc(m sqlcgen.Medication) entity.Medication {
	return entity.Medication{
		ID:             m.ID,
		MemberID:       m.MemberId,
		UserID:         m.UserId,
		Name:           m.Name,
		Category:       m.Category,
		DosageAmount:   m.DosageAmount,
		Frequency:      m.Frequency,
		StockQuantity:  intPtr(m.StockQuantity),
		StockAlertDate: m.StockAlertDate,
		IntervalHours:  intPtr(m.IntervalHours),
		Instructions:   m.Instructions,
		DisplayOrder:   int(m.DisplayOrder),
		IsActive:       m.IsActive,
		Status:         m.Status,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}

func (r *MedicationRepository) ListByMember(ctx context.Context, memberID string) ([]entity.Medication, error) {
	rows, err := r.q.ListMedicationsByMember(ctx, memberID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.Medication, 0, len(rows))
	for _, m := range rows {
		list = append(list, medicationFromSqlc(m))
	}
	return list, nil
}

func (r *MedicationRepository) ListByUser(ctx context.Context, userID string) ([]entity.Medication, error) {
	rows, err := r.q.ListMedicationsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.Medication, 0, len(rows))
	for _, m := range rows {
		list = append(list, medicationFromSqlc(m))
	}
	return list, nil
}

func (r *MedicationRepository) FindByID(ctx context.Context, id string) (*entity.Medication, error) {
	m, err := r.q.GetMedication(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := medicationFromSqlc(m)
	return &e, nil
}

func (r *MedicationRepository) Create(ctx context.Context, in repository.CreateMedicationInput) (*entity.Medication, error) {
	// displayOrder/isActive/status は DB 既定値に委ねる(旧 INSERT 同様、未指定)。
	m := gormMedication{
		ID:             auth.NewID(),
		MemberID:       in.MemberID,
		UserID:         in.UserID,
		Name:           in.Name,
		Category:       in.Category,
		DosageAmount:   in.DosageAmount,
		Frequency:      in.Frequency,
		StockQuantity:  in.StockQuantity,
		StockAlertDate: in.StockAlertDate,
		Instructions:   in.Instructions,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *MedicationRepository) Update(ctx context.Context, id string, in repository.UpdateMedicationInput) (*entity.Medication, error) {
	// updatedAt は更新の有無に関わらず常に now()。
	fields := map[string]any{"updatedAt": gorm.Expr("now()")}
	if in.Name != nil {
		fields["name"] = *in.Name
	}
	if in.Category != nil {
		fields["category"] = *in.Category
	}
	if in.DosageAmount != nil {
		fields["dosageAmount"] = *in.DosageAmount
	}
	if in.Frequency != nil {
		fields["frequency"] = *in.Frequency
	}
	if in.StockQuantity != nil {
		fields["stockQuantity"] = *in.StockQuantity
	}
	if in.StockAlertDate != nil {
		fields["stockAlertDate"] = *in.StockAlertDate
	}
	if in.Instructions != nil {
		fields["instructions"] = *in.Instructions
	}
	if in.IsActive != nil {
		fields["isActive"] = *in.IsActive
	}
	if in.Status != nil {
		fields["status"] = *in.Status
	}
	if err := r.gdb.WithContext(ctx).Model(&gormMedication{}).
		Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, id)
}

func (r *MedicationRepository) UpdateStock(ctx context.Context, id string, quantity int) (*entity.Medication, error) {
	if err := r.gdb.WithContext(ctx).Model(&gormMedication{}).Where(`"id" = ?`, id).
		Updates(map[string]any{"stockQuantity": quantity, "updatedAt": gorm.Expr("now()")}).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, id)
}

func (r *MedicationRepository) Reorder(ctx context.Context, userID string, orderedIDs []string) error {
	return r.gdb.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for i, id := range orderedIDs {
			if err := tx.Model(&gormMedication{}).
				Where(`"id" = ? AND "userId" = ?`, id, userID).
				Updates(map[string]any{"displayOrder": i, "updatedAt": gorm.Expr("now()")}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *MedicationRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormMedication{}).Error
}
