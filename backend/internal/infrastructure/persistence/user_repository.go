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
		ResetAttempts:        int(u.ResetAttempts),
		TokenVersion:         int(u.TokenVersion),
		GoogleID:             u.GoogleId,
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

func (r *UserRepository) FindByGoogleID(ctx context.Context, googleID string) (*entity.User, error) {
	u, err := r.q.GetUserByGoogleID(ctx, &googleID)
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
		GoogleID:           u.GoogleID,
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
		"resetAttempts":        u.ResetAttempts,
		"googleId":             u.GoogleID,
		"updatedAt":            gorm.Expr("now()"),
	}
	return r.gdb.WithContext(ctx).Model(&gormUser{}).Where(`"id" = ?`, u.ID).Updates(fields).Error
}

// TokenVersion は発行済みトークンの世代だけを引く。
//
// 認証のたびに呼ばれるので、行全体 (パスワードハッシュや発行中のコードを含む) を
// 読む FindByID は使わない。
func (r *UserRepository) TokenVersion(ctx context.Context, id string) (int, bool, error) {
	v, err := r.q.GetUserTokenVersion(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, err
	}
	return int(v), true, nil
}

// BumpTokenVersion は発行済みトークンの世代を DB 内で 1 つ繰り上げる。
//
// 読み出した値に 1 を足して書き戻す形にはしない。世代を上げた直後に、
// 上げる前の値を握った並行リクエストが汎用 Update を完了させると、
// 世代が巻き戻って失効させたはずの JWT が再び通ってしまう。
// プロフィール更新のような何気ない操作が攻撃者を呼び戻すことになる。
func (r *UserRepository) BumpTokenVersion(ctx context.Context, id string) error {
	return r.q.BumpUserTokenVersion(ctx, id)
}
