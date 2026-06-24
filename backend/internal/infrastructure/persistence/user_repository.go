package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"gorm.io/gorm"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/sqlc/sqlcgen"
)

// UserRepository は "User" テーブルのリポジトリ。
// 検索系(FindByEmail/FindByID)は sqlc、書き込み系(Create/Update)は GORM を使う。
type UserRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewUserRepository(db *database.DB) *UserRepository {
	return &UserRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func userFromSqlc(u sqlcgen.User) entity.User {
	return entity.User{
		ID:                   u.ID,
		Email:                u.Email,
		Password:             u.Password,
		DisplayName:          u.DisplayName,
		CharacterType:        u.CharacterType,
		CharacterName:        u.CharacterName,
		EmailVerified:        u.EmailVerified,
		VerificationCode:     u.VerificationCode,
		VerificationExpiry:   u.VerificationExpiry,
		VerificationAttempts: int(u.VerificationAttempts),
		ResetCode:            u.ResetCode,
		ResetCodeExpiry:      u.ResetCodeExpiry,
		CreatedAt:            u.CreatedAt,
		UpdatedAt:            u.UpdatedAt,
	}
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	u, err := r.q.GetUserByEmail(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := userFromSqlc(u)
	return &e, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*entity.User, error) {
	u, err := r.q.GetUserByID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := userFromSqlc(u)
	return &e, nil
}

func (r *UserRepository) Create(ctx context.Context, u *entity.User) error {
	// 旧 INSERT 同様、characterName/verificationAttempts/resetCode 等は未指定(既定値/NULL)。
	m := gormUser{
		ID:                 u.ID,
		Email:              u.Email,
		Password:           u.Password,
		DisplayName:        u.DisplayName,
		CharacterType:      u.CharacterType,
		EmailVerified:      u.EmailVerified,
		VerificationCode:   u.VerificationCode,
		VerificationExpiry: u.VerificationExpiry,
	}
	return r.gdb.WithContext(ctx).Create(&m).Error
}

func (r *UserRepository) Update(ctx context.Context, u *entity.User) error {
	// 旧実装は全列を無条件に上書きする(updatedAt は now())。
	fields := map[string]any{
		"email":                u.Email,
		"password":             u.Password,
		"displayName":          u.DisplayName,
		"characterType":        u.CharacterType,
		"characterName":        u.CharacterName,
		"emailVerified":        u.EmailVerified,
		"verificationCode":     u.VerificationCode,
		"verificationExpiry":   u.VerificationExpiry,
		"verificationAttempts": u.VerificationAttempts,
		"resetCode":            u.ResetCode,
		"resetCodeExpiry":      u.ResetCodeExpiry,
		"updatedAt":            gorm.Expr("now()"),
	}
	return r.gdb.WithContext(ctx).Model(&gormUser{}).Where(`"id" = ?`, u.ID).Updates(fields).Error
}
