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

// MedicationRecordRepository は "MedicationRecord" テーブルの生SQL実装
type MedicationRecordRepository struct {
	db *database.DB
}

func NewMedicationRecordRepository(db *database.DB) *MedicationRecordRepository {
	return &MedicationRecordRepository{db: db}
}

const recordColumns = `"id", "memberId", "medicationId", "userId", "scheduleId", "takenAt", "notes", "dosageAmount"`

func scanRecord(row pgx.Row) (*entity.MedicationRecord, error) {
	var r entity.MedicationRecord
	err := row.Scan(&r.ID, &r.MemberID, &r.MedicationID, &r.UserID, &r.ScheduleID,
		&r.TakenAt, &r.Notes, &r.DosageAmount)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func (r *MedicationRecordRepository) queryList(ctx context.Context, where, arg string) ([]entity.MedicationRecord, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+recordColumns+` FROM "MedicationRecord" WHERE `+where+` ORDER BY "takenAt" DESC`, arg)
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

func (r *MedicationRecordRepository) ListByUser(ctx context.Context, userID string) ([]entity.MedicationRecord, error) {
	return r.queryList(ctx, `"userId"=$1`, userID)
}

func (r *MedicationRecordRepository) ListByMember(ctx context.Context, memberID string) ([]entity.MedicationRecord, error) {
	return r.queryList(ctx, `"memberId"=$1`, memberID)
}

func (r *MedicationRecordRepository) FindByID(ctx context.Context, id string) (*entity.MedicationRecord, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+recordColumns+` FROM "MedicationRecord" WHERE "id"=$1`, id)
	return scanRecord(row)
}

func (r *MedicationRecordRepository) Create(ctx context.Context, in repository.CreateRecordInput) (*entity.MedicationRecord, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "MedicationRecord" ("id", "memberId", "medicationId", "userId", "scheduleId", "takenAt", "notes", "dosageAmount")
		 VALUES ($1,$2,$3,$4,$5, COALESCE($6, now()), $7, $8)
		 RETURNING `+recordColumns,
		id, in.MemberID, in.MedicationID, in.UserID, in.ScheduleID, in.TakenAt, in.Notes, in.DosageAmount)
	return scanRecord(row)
}

func (r *MedicationRecordRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM "MedicationRecord" WHERE "id"=$1`, id)
	return err
}
