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

// prescriptionColumns / prescriptionItemColumns は一覧(List)のバッチ取得で利用する列一覧。
const prescriptionColumns = `"id", "userId", "memberId", "prescriptionName", "prescribedBy", "prescribedAt", "expiresAt", "pharmacyName", "electronicCode", "notes", "createdAt"`

const prescriptionItemColumns = `"id", "prescriptionId", "name", "dosage", "frequency", "days", "sortOrder"`

// PrescriptionRepository は "Prescription" / "PrescriptionItem" テーブルのリポジトリ。
// 静的検索(FindByID/明細取得)は sqlc、書き込み(Create/Update/Delete/ReplaceItems)は GORM。
// 一覧(List)は明細をまとめて取得するバッチ生SQL(pgx)を pool で維持する(N+1回避)。
type PrescriptionRepository struct {
	gdb  *gorm.DB
	q    *sqlcgen.Queries
	pool *pgxpool.Pool
}

func NewPrescriptionRepository(db *database.DB) *PrescriptionRepository {
	return &PrescriptionRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool), pool: db.Pool}
}

func prescriptionFromSqlc(p sqlcgen.GetPrescriptionRow) entity.Prescription {
	return entity.Prescription{
		ID:               p.ID,
		UserID:           p.UserId,
		MemberID:         p.MemberId,
		PrescriptionName: p.PrescriptionName,
		PrescribedBy:     p.PrescribedBy,
		PrescribedAt:     p.PrescribedAt,
		ExpiresAt:        p.ExpiresAt,
		PharmacyName:     p.PharmacyName,
		ElectronicCode:   p.ElectronicCode,
		Notes:            p.Notes,
		CreatedAt:        p.CreatedAt,
	}
}

func itemFromSqlc(it sqlcgen.ListPrescriptionItemsRow) entity.PrescriptionItem {
	return entity.PrescriptionItem{
		ID:             it.ID,
		PrescriptionID: it.PrescriptionId,
		Name:           it.Name,
		Dosage:         it.Dosage,
		Frequency:      it.Frequency,
		Days:           intPtr(it.Days),
		SortOrder:      int(it.SortOrder),
	}
}

// scanPrescriptionItems は prescriptionItemColumns 順の行群を PrescriptionItem に変換する(List のバッチ用)。
func scanPrescriptionItems(rows pgx.Rows) ([]entity.PrescriptionItem, error) {
	items := make([]entity.PrescriptionItem, 0)
	for rows.Next() {
		var it entity.PrescriptionItem
		if err := rows.Scan(&it.ID, &it.PrescriptionID, &it.Name, &it.Dosage, &it.Frequency, &it.Days, &it.SortOrder); err != nil {
			return nil, err
		}
		items = append(items, it)
	}
	return items, rows.Err()
}

func (r *PrescriptionRepository) List(ctx context.Context, userID string) ([]entity.Prescription, error) {
	rows, err := r.q.ListPrescriptionsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	list := make([]entity.Prescription, 0, len(rows))
	ids := make([]string, 0, len(rows))
	byID := make(map[string]int, len(rows))
	for _, row := range rows {
		byID[row.ID] = len(list)
		ids = append(ids, row.ID)
		list = append(list, entity.Prescription{
			ID:               row.ID,
			UserID:           row.UserId,
			MemberID:         row.MemberId,
			PrescriptionName: row.PrescriptionName,
			PrescribedBy:     row.PrescribedBy,
			PrescribedAt:     row.PrescribedAt,
			ExpiresAt:        row.ExpiresAt,
			PharmacyName:     row.PharmacyName,
			ElectronicCode:   row.ElectronicCode,
			Notes:            row.Notes,
			CreatedAt:        row.CreatedAt,
			Items:            []entity.PrescriptionItem{},
		})
	}
	if len(ids) == 0 {
		return list, nil
	}

	// 明細は一度にまとめて引く。処方箋ごとに引くと件数分の往復になる
	items, err := r.q.ListPrescriptionItemsForPrescriptions(ctx, ids)
	if err != nil {
		return nil, err
	}
	for _, it := range items {
		idx, ok := byID[it.PrescriptionId]
		if !ok {
			continue
		}
		list[idx].Items = append(list[idx].Items, entity.PrescriptionItem{
			ID:             it.ID,
			PrescriptionID: it.PrescriptionId,
			Name:           it.Name,
			Dosage:         it.Dosage,
			Frequency:      it.Frequency,
			Days:           intPtr(it.Days),
			SortOrder:      int(it.SortOrder),
		})
	}
	return list, nil
}

func (r *PrescriptionRepository) loadItems(ctx context.Context, prescriptionID string) ([]entity.PrescriptionItem, error) {
	rows, err := r.q.ListPrescriptionItems(ctx, prescriptionID)
	if err != nil {
		return nil, err
	}
	items := make([]entity.PrescriptionItem, 0, len(rows))
	for _, it := range rows {
		items = append(items, itemFromSqlc(it))
	}
	return items, nil
}

func (r *PrescriptionRepository) FindByID(ctx context.Context, id string) (*entity.Prescription, error) {
	p, err := r.q.GetPrescription(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	ent := prescriptionFromSqlc(p)
	items, err := r.loadItems(ctx, id)
	if err != nil {
		return nil, err
	}
	ent.Items = items
	return &ent, nil
}

// ReplaceItems は処方明細を指定内容で置き換える。
func (r *PrescriptionRepository) ReplaceItems(ctx context.Context, prescriptionID string, items []entity.PrescriptionItem) error {
	return r.gdb.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where(`"prescriptionId" = ?`, prescriptionID).Delete(&gormPrescriptionItem{}).Error; err != nil {
			return err
		}
		for i, it := range items {
			if it.Name == "" {
				continue
			}
			rec := gormPrescriptionItem{
				ID:             auth.NewID(),
				PrescriptionID: prescriptionID,
				Name:           it.Name,
				Dosage:         it.Dosage,
				Frequency:      it.Frequency,
				Days:           it.Days,
				SortOrder:      i,
			}
			if err := tx.Create(&rec).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *PrescriptionRepository) Create(ctx context.Context, in repository.CreatePrescriptionInput) (*entity.Prescription, error) {
	m := gormPrescription{
		ID:               auth.NewID(),
		UserID:           in.UserID,
		MemberID:         in.MemberID,
		PrescriptionName: in.PrescriptionName,
		PrescribedBy:     in.PrescribedBy,
		PrescribedAt:     in.PrescribedAt,
		ExpiresAt:        in.ExpiresAt,
		PharmacyName:     in.PharmacyName,
		ElectronicCode:   in.ElectronicCode,
		Notes:            in.Notes,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *PrescriptionRepository) Update(ctx context.Context, id string, in repository.UpdatePrescriptionInput) (*entity.Prescription, error) {
	fields := map[string]any{}
	if in.PrescriptionName != nil {
		fields["prescriptionName"] = *in.PrescriptionName
	}
	if in.PrescribedBy != nil {
		fields["prescribedBy"] = *in.PrescribedBy
	}
	if in.PrescribedAt != nil {
		fields["prescribedAt"] = *in.PrescribedAt
	}
	if in.ExpiresAt != nil {
		fields["expiresAt"] = *in.ExpiresAt
	}
	if in.PharmacyName != nil {
		fields["pharmacyName"] = *in.PharmacyName
	}
	if in.ElectronicCode != nil {
		fields["electronicCode"] = *in.ElectronicCode
	}
	if in.Notes != nil {
		fields["notes"] = *in.Notes
	}
	if len(fields) > 0 {
		if err := r.gdb.WithContext(ctx).Model(&gormPrescription{}).
			Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(ctx, id)
}

func (r *PrescriptionRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormPrescription{}).Error
}
