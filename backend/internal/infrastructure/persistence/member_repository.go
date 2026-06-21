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

// MemberRepository は members テーブルの生SQL実装
type MemberRepository struct {
	db *database.DB
}

func NewMemberRepository(db *database.DB) *MemberRepository {
	return &MemberRepository{db: db}
}

const memberColumns = `id, user_id, member_type, name, pet_type, photo_url, birth_date, notes, created_at, updated_at`

func scanMember(row pgx.Row) (*entity.Member, error) {
	var m entity.Member
	err := row.Scan(&m.ID, &m.UserID, &m.MemberType, &m.Name, &m.PetType, &m.PhotoURL,
		&m.BirthDate, &m.Notes, &m.CreatedAt, &m.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MemberRepository) List(ctx context.Context, userID string) ([]entity.Member, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT `+memberColumns+` FROM members WHERE user_id=$1 ORDER BY created_at ASC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	members := make([]entity.Member, 0)
	for rows.Next() {
		var m entity.Member
		if err := rows.Scan(&m.ID, &m.UserID, &m.MemberType, &m.Name, &m.PetType, &m.PhotoURL,
			&m.BirthDate, &m.Notes, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, rows.Err()
}

func (r *MemberRepository) FindByID(ctx context.Context, id string) (*entity.Member, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+memberColumns+` FROM members WHERE id=$1`, id)
	return scanMember(row)
}

func (r *MemberRepository) Create(ctx context.Context, in repository.CreateMemberInput) (*entity.Member, error) {
	id := auth.NewID()
	row := r.db.Pool.QueryRow(ctx,
		`INSERT INTO members (id, user_id, member_type, name, pet_type, birth_date, notes, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7, now(), now())
		 RETURNING `+memberColumns,
		id, in.UserID, in.MemberType, in.Name, in.PetType, in.BirthDate, in.Notes)
	return scanMember(row)
}

func (r *MemberRepository) Update(ctx context.Context, id string, in repository.UpdateMemberInput) (*entity.Member, error) {
	row := r.db.Pool.QueryRow(ctx,
		`UPDATE members SET
			name = COALESCE($2, name),
			pet_type = COALESCE($3, pet_type),
			birth_date = COALESCE($4, birth_date),
			notes = COALESCE($5, notes),
			updated_at = now()
		 WHERE id=$1
		 RETURNING `+memberColumns,
		id, in.Name, in.PetType, in.BirthDate, in.Notes)
	return scanMember(row)
}

func (r *MemberRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, `DELETE FROM members WHERE id=$1`, id)
	return err
}
