package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/infrastructure/database"
)

// UserRepository は "User" テーブルの生SQL実装
type UserRepository struct {
	db *database.DB
}

func NewUserRepository(db *database.DB) *UserRepository {
	return &UserRepository{db: db}
}

const userColumns = `"id", "email", "password", "displayName", "characterType", "characterName",
	"emailVerified", "verificationCode", "verificationExpiry", "verificationAttempts",
	"resetCode", "resetCodeExpiry", "createdAt", "updatedAt"`

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
	row := r.db.Pool.QueryRow(ctx, `SELECT `+userColumns+` FROM "User" WHERE "email" = $1`, email)
	return scanUser(row)
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*entity.User, error) {
	row := r.db.Pool.QueryRow(ctx, `SELECT `+userColumns+` FROM "User" WHERE "id" = $1`, id)
	return scanUser(row)
}

func (r *UserRepository) Create(ctx context.Context, u *entity.User) error {
	_, err := r.db.Pool.Exec(ctx,
		`INSERT INTO "User" ("id", "email", "password", "displayName", "characterType", "emailVerified",
			"verificationCode", "verificationExpiry", "createdAt", "updatedAt")
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`,
		u.ID, u.Email, u.Password, u.DisplayName, u.CharacterType, u.EmailVerified,
		u.VerificationCode, u.VerificationExpiry,
	)
	return err
}

func (r *UserRepository) Update(ctx context.Context, u *entity.User) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE "User" SET "email"=$2, "password"=$3, "displayName"=$4, "characterType"=$5, "characterName"=$6,
			"emailVerified"=$7, "verificationCode"=$8, "verificationExpiry"=$9, "verificationAttempts"=$10,
			"resetCode"=$11, "resetCodeExpiry"=$12, "updatedAt"=now()
		 WHERE "id"=$1`,
		u.ID, u.Email, u.Password, u.DisplayName, u.CharacterType, u.CharacterName,
		u.EmailVerified, u.VerificationCode, u.VerificationExpiry, u.VerificationAttempts,
		u.ResetCode, u.ResetCodeExpiry,
	)
	return err
}
