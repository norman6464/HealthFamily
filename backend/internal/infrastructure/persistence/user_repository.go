package persistence

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"gorm.io/gorm"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
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

// UpdateProfile はプロフィール項目だけを書き戻す。
//
// 資格情報 (password, 各コード, 試行回数, tokenVersion) はここで触らない。
// 読み出し時点のスナップショットを丸ごと書き戻す形にすると、その間に走った
// パスワード再設定を巻き戻し、消費済みの再設定コードまで復活させてしまう。
// 資格情報の遷移はそれぞれ専用のメソッドで、DB 内で完結させる。
func (r *UserRepository) UpdateProfile(ctx context.Context, u *entity.User) error {
	return r.gdb.WithContext(ctx).Model(&gormUser{}).Where(`"id" = ?`, u.ID).
		Updates(map[string]any{
			"displayName":   u.DisplayName,
			"characterType": u.CharacterType,
			"characterName": u.CharacterName,
			"updatedAt":     gorm.Expr("now()"),
		}).Error
}

// SavePendingRegistration は未認証アカウントの登録内容を差し替え、新しい認証コードを置く。
// 認証済みのアカウントには使わない (呼び出し側で弾く)。
func (r *UserRepository) SavePendingRegistration(
	ctx context.Context, id, hashedPassword string, displayName *string, code string, expiry time.Time,
) error {
	return r.gdb.WithContext(ctx).Model(&gormUser{}).Where(`"id" = ?`, id).
		Updates(map[string]any{
			"password":             hashedPassword,
			"displayName":          displayName,
			"verificationCode":     code,
			"verificationExpiry":   expiry,
			"verificationAttempts": 0,
			"updatedAt":            gorm.Expr("now()"),
		}).Error
}

// SaveVerificationCode は新しい認証コードを置き、失敗回数を戻す。
// 戻さないと、総当たりを受けた本人が再送を受け取ってもやり直せない。
func (r *UserRepository) SaveVerificationCode(ctx context.Context, id, code string, expiry time.Time) error {
	return r.gdb.WithContext(ctx).Model(&gormUser{}).Where(`"id" = ?`, id).
		Updates(map[string]any{
			"verificationCode":     code,
			"verificationExpiry":   expiry,
			"verificationAttempts": 0,
			"updatedAt":            gorm.Expr("now()"),
		}).Error
}

// MarkEmailVerified は認証済みにし、使い終わったコードを捨てる。
func (r *UserRepository) MarkEmailVerified(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Model(&gormUser{}).Where(`"id" = ?`, id).
		Updates(map[string]any{
			"emailVerified":        true,
			"verificationCode":     nil,
			"verificationExpiry":   nil,
			"verificationAttempts": 0,
			"updatedAt":            gorm.Expr("now()"),
		}).Error
}

// IncrementVerificationAttempts は失敗回数を DB 内で1つ増やし、
// 上限に達していればコードを捨てる。
//
// 読んだ値に +1 して書き戻す形だと、同時に来たリクエストが同じ値を読み、
// 全員が同じ数を書く。上限に対して並列度ぶんだけ余計に試せてしまい、
// アカウント側の総当たり防御が並列数だけ薄くなる。
func (r *UserRepository) IncrementVerificationAttempts(ctx context.Context, id string, max int) error {
	return r.gdb.WithContext(ctx).Exec(`
		UPDATE "User"
		SET "verificationAttempts" = "verificationAttempts" + 1,
		    "verificationCode"     = CASE WHEN "verificationAttempts" + 1 >= ? THEN NULL ELSE "verificationCode" END,
		    "verificationExpiry"   = CASE WHEN "verificationAttempts" + 1 >= ? THEN NULL ELSE "verificationExpiry" END,
		    "updatedAt"            = now()
		WHERE "id" = ?`, max, max, id).Error
}

// SaveResetCode は再設定コードを置き、その試行回数を戻す。
func (r *UserRepository) SaveResetCode(ctx context.Context, id, code string, expiry time.Time) error {
	return r.gdb.WithContext(ctx).Model(&gormUser{}).Where(`"id" = ?`, id).
		Updates(map[string]any{
			"resetCode":       code,
			"resetCodeExpiry": expiry,
			"resetAttempts":   0,
			"updatedAt":       gorm.Expr("now()"),
		}).Error
}

// IncrementResetAttempts は再設定コードについて同じことを行う。
// メール認証とは別に数えるのは、片方への攻撃でもう片方まで
// 本人が使えなくなるのを避けるため。
func (r *UserRepository) IncrementResetAttempts(ctx context.Context, id string, max int) error {
	return r.gdb.WithContext(ctx).Exec(`
		UPDATE "User"
		SET "resetAttempts"   = "resetAttempts" + 1,
		    "resetCode"       = CASE WHEN "resetAttempts" + 1 >= ? THEN NULL ELSE "resetCode" END,
		    "resetCodeExpiry" = CASE WHEN "resetAttempts" + 1 >= ? THEN NULL ELSE "resetCodeExpiry" END,
		    "updatedAt"       = now()
		WHERE "id" = ?`, max, max, id).Error
}

// ApplyPasswordReset は新しいパスワードを設定し、コードを消して世代を繰り上げる。
//
// 再設定コードが残っている行にだけ適用する。呼び出し側は定数時間比較で
// コードを検証済みだが、その検証と書き込みの間に別の再設定が完了しうる。
// 条件を付けておけば、消費済みのコードで二度目が通ることはない。
//
// 世代の繰り上げも同じ文で行う。分けると、間に挟まった書き込みに
// 巻き戻され、失効させたはずのトークンが生き残る。
func (r *UserRepository) ApplyPasswordReset(ctx context.Context, id, hashedPassword string) error {
	res := r.gdb.WithContext(ctx).Exec(`
		UPDATE "User"
		SET "password"        = ?,
		    "resetCode"       = NULL,
		    "resetCodeExpiry" = NULL,
		    "resetAttempts"   = 0,
		    "tokenVersion"    = "tokenVersion" + 1,
		    "updatedAt"       = now()
		WHERE "id" = ? AND "resetCode" IS NOT NULL`, hashedPassword, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return repository.ErrResetCodeConsumed
	}
	return nil
}

// LinkGoogle は Google アカウントを紐付ける。
//
// resetCredentials は、紐付け先が未認証だった場合に true を渡す。そのとき
// パスワードと発行中のコードを捨てる。未認証のまま残っていた資格情報は
// 誰が設定したものか分からず、残すと事前登録による乗っ取りが成立する。
func (r *UserRepository) LinkGoogle(
	ctx context.Context, id, subject string, resetCredentials bool, displayName *string,
) error {
	fields := map[string]any{
		"googleId":      subject,
		"emailVerified": true,
		"updatedAt":     gorm.Expr("now()"),
	}
	if resetCredentials {
		fields["password"] = ""
		fields["displayName"] = displayName
		fields["verificationCode"] = nil
		fields["verificationExpiry"] = nil
		fields["verificationAttempts"] = 0
	}
	return r.gdb.WithContext(ctx).Model(&gormUser{}).Where(`"id" = ?`, id).Updates(fields).Error
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
