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
	// 未認証の行にだけ適用する。呼び出し側も認証状態を見ているが、
	// 読んでから書くまでの間に認証が完了しうる。そこで上書きを許すと、
	// 攻撃者が送ったパスワードが認証済みアカウントに載ってしまう。
	res := r.gdb.WithContext(ctx).Model(&gormUser{}).
		Where(`"id" = ? AND "emailVerified" = FALSE`, id).
		Updates(map[string]any{
			"password":             hashedPassword,
			"displayName":          displayName,
			"verificationCode":     code,
			"verificationExpiry":   expiry,
			"verificationAttempts": 0,
			"updatedAt":            gorm.Expr("now()"),
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return repository.ErrAlreadyVerified
	}
	return nil
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
// 呼び出し側が検証したコードを渡す。検証と書き込みの間に再送で
// 差し替わっていたら適用しない。古い検証結果で認証を通さないため。
func (r *UserRepository) MarkEmailVerified(ctx context.Context, id, verifiedCode string) error {
	res := r.gdb.WithContext(ctx).Model(&gormUser{}).
		Where(`"id" = ? AND "verificationCode" = ?`, id, verifiedCode).
		Updates(map[string]any{
			"emailVerified":        true,
			"verificationCode":     nil,
			"verificationExpiry":   nil,
			"verificationAttempts": 0,
			"updatedAt":            gorm.Expr("now()"),
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return repository.ErrCodeConsumed
	}
	return nil
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

// ApplyPasswordReset は新しいパスワードを設定し、コードを消して世代を繰り上げる。
//
// 再設定コードが残っている行にだけ適用する。呼び出し側は定数時間比較で
// コードを検証済みだが、その検証と書き込みの間に別の再設定が完了しうる。
// 条件を付けておけば、消費済みのコードで二度目が通ることはない。
//
// 世代の繰り上げも同じ文で行う。分けると、間に挟まった書き込みに
// 巻き戻され、失効させたはずのトークンが生き残る。
func (r *UserRepository) ApplyPasswordReset(ctx context.Context, id, verifiedCode, hashedPassword string) error {
	res := r.gdb.WithContext(ctx).Exec(`
		UPDATE "User"
		SET "password"        = ?,
		    "resetCode"       = NULL,
		    "resetCodeExpiry" = NULL,
		    "resetAttempts"   = 0,
		    "tokenVersion"    = "tokenVersion" + 1,
		    "updatedAt"       = now()
		WHERE "id" = ? AND "resetCode" = ?`, hashedPassword, id, verifiedCode)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return repository.ErrCodeConsumed
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

// ClaimVerificationAttempt は試行を1つ消費し、上限内であればコードを返す。
//
// 「読む → 比較 → 加算」の順にすると、並列に来たリクエストが全員同じ状態を
// 読んで全員が比較まで到達する。加算だけ原子的にしても縛れるのはラウンド数で、
// 1ラウンドあたり並列数だけ推測を試せてしまう。先に DB 内で消費し、
// 返ってきた回数が上限内のときだけコードを渡すことで、比較の回数そのものを縛る。
//
// ok が false なら上限超過。code が nil ならコード未発行。
// 上限に達した時点でコードは捨てられるので、その後は何を送っても当たらない。
func (r *UserRepository) ClaimVerificationAttempt(
	ctx context.Context, id string, max int,
) (code *string, expiresAt *time.Time, ok bool, err error) {
	return r.claimAttempt(ctx, id, max,
		"verificationAttempts", "verificationCode", "verificationExpiry")
}

// ClaimResetAttempt は再設定コードについて同じことを行う。
// メール認証とは別に数えるのは、片方への攻撃でもう片方まで
// 本人が使えなくなるのを避けるため。
func (r *UserRepository) ClaimResetAttempt(
	ctx context.Context, id string, max int,
) (code *string, expiresAt *time.Time, ok bool, err error) {
	return r.claimAttempt(ctx, id, max, "resetAttempts", "resetCode", "resetCodeExpiry")
}

// claimAttempt は消費と取得を1文で行う。列名は呼び出し元が固定値で渡す。
//
// 消費「前」のコードを返すのが肝。SET の CASE で上限到達時にコードを捨てるが、
// RETURNING は更新後の値なので、そのまま返すと上限ちょうどの回で必ず NULL になり、
// 4回間違えた本人が5回目に正しく入力しても通らなくなる。
// CTE で先に現在値を確保し、それを返す。
//
// 生きているコードが無ければ 1 行も返らない。数えるものが無いので消費もしない。
// ここで数えると、コードを持たないアカウントに投げるだけで書き込みを起こせる。
//
// コードを捨てるのは上限を「超えた」ときで、ちょうどの回では残す。上限の回で
// 消してしまうと、4回間違えた本人が5回目に正しく入力しても、直後の
// MarkEmailVerified がコードを見つけられず弾かれる。上限を超えた呼び出しは
// withinLimit=false で比較まで到達しないので、推測できる回数は変わらない。
func (r *UserRepository) claimAttempt(
	ctx context.Context, id string, max int, cntCol, codeCol, expCol string,
) (*string, *time.Time, bool, error) {
	var row struct {
		Code      *string
		ExpiresAt *time.Time
		Attempts  int
	}
	err := r.gdb.WithContext(ctx).Raw(`
		WITH cur AS (
		    SELECT "id", "`+codeCol+`" AS code, "`+expCol+`" AS expires_at
		    FROM "User"
		    WHERE "id" = ? AND "`+codeCol+`" IS NOT NULL AND "`+expCol+`" > now()
		    FOR UPDATE
		), upd AS (
		    UPDATE "User" u
		    SET "`+cntCol+`" = u."`+cntCol+`" + 1,
		        "`+codeCol+`" = CASE WHEN u."`+cntCol+`" + 1 > ? THEN NULL ELSE u."`+codeCol+`" END,
		        "`+expCol+`"  = CASE WHEN u."`+cntCol+`" + 1 > ? THEN NULL ELSE u."`+expCol+`" END,
		        "updatedAt"   = now()
		    FROM cur
		    WHERE u."id" = cur."id"
		    RETURNING u."`+cntCol+`" AS attempts
		)
		SELECT cur.code, cur.expires_at, upd.attempts FROM cur, upd`,
		id, max, max).Scan(&row).Error
	if err != nil {
		return nil, nil, false, err
	}
	if row.Attempts == 0 {
		// 生きているコードが無い。当たりようがないので、消費もせず素通りさせる
		return nil, nil, true, nil
	}
	if row.Attempts > max {
		return nil, nil, false, nil
	}
	return row.Code, row.ExpiresAt, true, nil
}
