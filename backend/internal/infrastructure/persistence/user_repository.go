package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/infrastructure/database"
)

// UserRepository は users テーブルの生SQL実装
type UserRepository struct {
	db *database.DB
}

func NewUserRepository(db *database.DB) *UserRepository {
	return &UserRepository{db: db}
}

const userColumns = `id, email, password, display_name, character_type, character_name,
	email_verified, verification_code, verification_expiry, verification_attempts,
	reset_code, reset_code_expiry, created_at, updated_at`

func scanUser(row pgx.Row) (*entity.User, error) {
	var u entity.User
	err := row.Scan(
		&u.ID, &u.Email, &u.Password, &u.DisplayName, &u.CharacterType, &u.CharacterName,
		&u.EmailVerified, &u.VerificationCode, &u.VerificationExpiry, &u.VerificationAttempts,
		&u.ResetCode, &u.ResetCodeExpiry, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+userColumns+` FROM users WHERE email = $1`, email)
	return scanUser(row)
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*entity.User, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+userColumns+` FROM users WHERE id = $1`, id)
	return scanUser(row)
}

func (r *UserRepository) Create(ctx context.Context, u *entity.User) error {
	_, err := r.db.Pool.Exec(ctx,
		`INSERT INTO users (id, email, password, display_name, character_type, email_verified,
			verification_code, verification_expiry, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`,
		u.ID, u.Email, u.Password, u.DisplayName, u.CharacterType, u.EmailVerified,
		u.VerificationCode, u.VerificationExpiry,
	)
	return err
}

func (r *UserRepository) Update(ctx context.Context, u *entity.User) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE users SET email=$2, password=$3, display_name=$4, character_type=$5, character_name=$6,
			email_verified=$7, verification_code=$8, verification_expiry=$9, verification_attempts=$10,
			reset_code=$11, reset_code_expiry=$12, updated_at=now()
		 WHERE id=$1`,
		u.ID, u.Email, u.Password, u.DisplayName, u.CharacterType, u.CharacterName,
		u.EmailVerified, u.VerificationCode, u.VerificationExpiry, u.VerificationAttempts,
		u.ResetCode, u.ResetCodeExpiry,
	)
	return err
}
