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

// EmergencyContactRepository は "EmergencyContact" テーブルの生SQL実装
type EmergencyContactRepository struct {
	db *database.DB
}

func NewEmergencyContactRepository(db *database.DB) *EmergencyContactRepository {
	return &EmergencyContactRepository{db: db}
}

const emergencyContactColumns = `"id", "userId", "memberId", "contactName", "phoneNumber", "relationship", "notes", "createdAt"`

func scanEmergencyContact(row pgx.Row) (*entity.EmergencyContact, error) {
	var e entity.EmergencyContact
	err := row.Scan(&e.ID, &e.UserID, &e.MemberID, &e.ContactName, &e.PhoneNumber, &e.Relationship, &e.Notes, &e.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *EmergencyContactRepository) List(ctx context.Context, userID string) ([]entity.EmergencyContact, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+emergencyContactColumns+` FROM "EmergencyContact" WHERE "userId"=$1 ORDER BY "createdAt" DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := make([]entity.EmergencyContact, 0)
	for rows.Next() {
		var e entity.EmergencyContact
		if err := rows.Scan(&e.ID, &e.UserID, &e.MemberID, &e.ContactName, &e.PhoneNumber, &e.Relationship, &e.Notes, &e.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, rows.Err()
}

func (r *EmergencyContactRepository) FindByID(ctx context.Context, id string) (*entity.EmergencyContact, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+emergencyContactColumns+` FROM "EmergencyContact" WHERE "id"=$1`, id)
	return scanEmergencyContact(row)
}

func (r *EmergencyContactRepository) Create(ctx context.Context, in repository.CreateEmergencyContactInput) (*entity.EmergencyContact, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO "EmergencyContact" ("id", "userId", "memberId", "contactName", "phoneNumber", "relationship", "notes", "createdAt")
		 VALUES ($1,$2,$3,$4,$5,$6,$7, now())
		 RETURNING `+emergencyContactColumns,
		id, in.UserID, in.MemberID, in.ContactName, in.PhoneNumber, in.Relationship, in.Notes)
	return scanEmergencyContact(row)
}

func (r *EmergencyContactRepository) Update(ctx context.Context, id string, in repository.UpdateEmergencyContactInput) (*entity.EmergencyContact, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE "EmergencyContact" SET
			"contactName" = COALESCE($2, "contactName"),
			"phoneNumber" = COALESCE($3, "phoneNumber"),
			"relationship" = COALESCE($4, "relationship"),
			"notes" = COALESCE($5, "notes")
		 WHERE "id"=$1
		 RETURNING `+emergencyContactColumns,
		id, in.ContactName, in.PhoneNumber, in.Relationship, in.Notes)
	return scanEmergencyContact(row)
}

func (r *EmergencyContactRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM "EmergencyContact" WHERE "id"=$1`, id)
	return err
}
