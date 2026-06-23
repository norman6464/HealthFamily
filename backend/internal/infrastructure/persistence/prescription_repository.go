package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/pkg/auth"
)

// PrescriptionRepository は "Prescription" テーブルの生SQL実装
type PrescriptionRepository struct {
	db *database.DB
}

func NewPrescriptionRepository(db *database.DB) *PrescriptionRepository {
	return &PrescriptionRepository{db: db}
}

const prescriptionColumns = `"id", "userId", "memberId", "prescriptionName", "prescribedBy", "prescribedAt", "expiresAt", "pharmacyName", "electronicCode", "notes", "createdAt"`

const prescriptionItemColumns = `"id", "prescriptionId", "name", "dosage", "frequency", "days", "sortOrder"`

// scanPrescriptionItems は prescriptionItemColumns 順の行群を PrescriptionItem に変換する。
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

func scanPrescription(row pgx.Row) (*entity.Prescription, error) {
	var p entity.Prescription
	err := row.Scan(&p.ID, &p.UserID, &p.MemberID, &p.PrescriptionName, &p.PrescribedBy, &p.PrescribedAt, &p.ExpiresAt, &p.PharmacyName, &p.ElectronicCode, &p.Notes, &p.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PrescriptionRepository) List(ctx context.Context, userID string) ([]entity.Prescription, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+prescriptionColumns+` FROM "Prescription" WHERE "userId"=$1 ORDER BY "createdAt" DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.Prescription, 0)
	for rows.Next() {
		var p entity.Prescription
		if err := rows.Scan(&p.ID, &p.UserID, &p.MemberID, &p.PrescriptionName, &p.PrescribedBy, &p.PrescribedAt, &p.ExpiresAt, &p.PharmacyName, &p.ElectronicCode, &p.Notes, &p.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	// 明細をまとめて取得して各処方箋へ割り当て（N+1回避）
	ids := make([]string, len(list))
	for i := range list {
		ids[i] = list[i].ID
		list[i].Items = []entity.PrescriptionItem{}
	}
	if len(ids) > 0 {
		itemRows, err := r.db.Pool.Query(ctx,
			`SELECT `+prescriptionItemColumns+`
			 FROM "PrescriptionItem" WHERE "prescriptionId" = ANY($1) ORDER BY "sortOrder", "createdAt"`, ids)
		if err != nil {
			return nil, err
		}
		defer itemRows.Close()
		items, err := scanPrescriptionItems(itemRows)
		if err != nil {
			return nil, err
		}
		byPid := map[string]int{}
		for i := range list {
			byPid[list[i].ID] = i
		}
		for _, it := range items {
			if idx, ok := byPid[it.PrescriptionID]; ok {
				list[idx].Items = append(list[idx].Items, it)
			}
		}
	}
	return list, nil
}

func (r *PrescriptionRepository) loadItems(ctx context.Context, prescriptionID string) ([]entity.PrescriptionItem, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+prescriptionItemColumns+`
		 FROM "PrescriptionItem" WHERE "prescriptionId"=$1 ORDER BY "sortOrder", "createdAt"`, prescriptionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPrescriptionItems(rows)
}

func (r *PrescriptionRepository) FindByID(ctx context.Context, id string) (*entity.Prescription, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+prescriptionColumns+` FROM "Prescription" WHERE "id"=$1`, id)
	p, err := scanPrescription(row)
	if err != nil || p == nil {
		return p, err
	}
	items, err := r.loadItems(ctx, id)
	if err != nil {
		return nil, err
	}
	p.Items = items
	return p, nil
}

// ReplaceItems は処方明細を指定内容で置き換える。
func (r *PrescriptionRepository) ReplaceItems(ctx context.Context, prescriptionID string, items []entity.PrescriptionItem) error {
	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	if _, err := tx.Exec(ctx, `DELETE FROM "PrescriptionItem" WHERE "prescriptionId"=$1`, prescriptionID); err != nil {
		return err
	}
	for i, it := range items {
		if it.Name == "" {
			continue
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO "PrescriptionItem" ("id", "prescriptionId", "name", "dosage", "frequency", "days", "sortOrder", "createdAt")
			 VALUES ($1,$2,$3,$4,$5,$6,$7, now())`,
			auth.NewID(), prescriptionID, it.Name, it.Dosage, it.Frequency, it.Days, i); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (r *PrescriptionRepository) Create(ctx context.Context, in repository.CreatePrescriptionInput) (*entity.Prescription, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "Prescription" ("id", "userId", "memberId", "prescriptionName", "prescribedBy", "prescribedAt", "expiresAt", "pharmacyName", "electronicCode", "notes", "createdAt")
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
		 RETURNING `+prescriptionColumns,
		id, in.UserID, in.MemberID, in.PrescriptionName, in.PrescribedBy, in.PrescribedAt, in.ExpiresAt, in.PharmacyName, in.ElectronicCode, in.Notes)
	return scanPrescription(row)
}

func (r *PrescriptionRepository) Update(ctx context.Context, id string, in repository.UpdatePrescriptionInput) (*entity.Prescription, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE "Prescription" SET
			"prescriptionName" = COALESCE($2, "prescriptionName"),
			"prescribedBy" = COALESCE($3, "prescribedBy"),
			"prescribedAt" = COALESCE($4, "prescribedAt"),
			"expiresAt" = COALESCE($5, "expiresAt"),
			"pharmacyName" = COALESCE($6, "pharmacyName"),
			"electronicCode" = COALESCE($7, "electronicCode"),
			"notes" = COALESCE($8, "notes")
		 WHERE "id"=$1
		 RETURNING `+prescriptionColumns,
		id, in.PrescriptionName, in.PrescribedBy, in.PrescribedAt, in.ExpiresAt, in.PharmacyName, in.ElectronicCode, in.Notes)
	return scanPrescription(row)
}

func (r *PrescriptionRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM "Prescription" WHERE "id"=$1`, id)
	return err
}
