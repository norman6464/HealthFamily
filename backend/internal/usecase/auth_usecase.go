package usecase

import (
	"context"
	"strings"
	"time"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/pkg/auth"
	"healthfamily/internal/pkg/googleauth"
	"healthfamily/internal/pkg/mailer"
)

// AuthUsecase は認証関連のビジネスロジック
type AuthUsecase struct {
	users  repository.UserRepository
	tokens *auth.TokenManager
	mail   mailer.Mailer
	google googleauth.Verifier // nil なら Google ログイン無効
	now    func() time.Time
}

func NewAuthUsecase(users repository.UserRepository, tokens *auth.TokenManager, mail mailer.Mailer, google googleauth.Verifier) *AuthUsecase {
	return &AuthUsecase{users: users, tokens: tokens, mail: mail, google: google, now: time.Now}
}

// SignUp は新規登録し、認証コードをメール送信する。
// ユーザー列挙攻撃を防ぐため、既存の認証済みユーザーでも同じ結果を返す。
func (uc *AuthUsecase) SignUp(ctx context.Context, email, password string, displayName *string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	code := auth.NewVerificationCode()
	expiry := uc.now().Add(10 * time.Minute)
	hashed, err := auth.HashPassword(password)
	if err != nil {
		return err
	}

	existing, err := uc.users.FindByEmail(ctx, email)
	if err != nil {
		return err
	}
	if existing != nil {
		if existing.EmailVerified {
			return nil // 列挙防止: 何もせず成功扱い
		}
		existing.Password = hashed
		existing.DisplayName = displayName
		existing.VerificationCode = &code
		existing.VerificationExpiry = &expiry
		if err := uc.users.Update(ctx, existing); err != nil {
			return err
		}
		return uc.mail.SendVerificationCode(ctx, email, code)
	}

	u := &entity.User{
		ID:                 auth.NewID(),
		Email:              email,
		Password:           hashed,
		DisplayName:        displayName,
		CharacterType:      "cat",
		EmailVerified:      false,
		VerificationCode:   &code,
		VerificationExpiry: &expiry,
	}
	if err := uc.users.Create(ctx, u); err != nil {
		return err
	}
	return uc.mail.SendVerificationCode(ctx, email, code)
}

// Verify は認証コードを検証しメールアドレスを有効化する
func (uc *AuthUsecase) Verify(ctx context.Context, email, code string) (string, *entity.User, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	u, err := uc.users.FindByEmail(ctx, email)
	if err != nil {
		return "", nil, err
	}
	if u == nil {
		return "", nil, domain.NewValidation("認証コードが正しくありません")
	}
	if u.EmailVerified {
		token, err := uc.tokens.Generate(u.ID, u.Email, uc.now())
		return token, u, err
	}
	if u.VerificationCode == nil || u.VerificationExpiry == nil ||
		*u.VerificationCode != code || uc.now().After(*u.VerificationExpiry) {
		return "", nil, domain.NewValidation("認証コードが正しくないか、有効期限が切れています")
	}

	u.EmailVerified = true
	u.VerificationCode = nil
	u.VerificationExpiry = nil
	if err := uc.users.Update(ctx, u); err != nil {
		return "", nil, err
	}
	token, err := uc.tokens.Generate(u.ID, u.Email, uc.now())
	return token, u, err
}

// Login はメール・パスワードを検証しJWTを発行する
func (uc *AuthUsecase) Login(ctx context.Context, email, password string) (string, *entity.User, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	u, err := uc.users.FindByEmail(ctx, email)
	if err != nil {
		return "", nil, err
	}
	if u == nil || !auth.VerifyPassword(u.Password, password) {
		return "", nil, domain.NewValidation("メールアドレスまたはパスワードが正しくありません")
	}
	if !u.EmailVerified {
		return "", nil, domain.NewForbidden("メールアドレスが認証されていません")
	}
	token, err := uc.tokens.Generate(u.ID, u.Email, uc.now())
	return token, u, err
}

// TestLogin はE2Eテスト用のログインバイパス。指定メールの検証済みユーザーを
// 取得（無ければ作成）してJWTを発行する。ハンドラ側でシークレット検証済み前提。
// LoginWithGoogle は Google の ID トークン (OIDC) を検証してログインする。
// googleId 一致 → 既存メールへの紐付け → 新規作成 の順で解決する。
func (uc *AuthUsecase) LoginWithGoogle(ctx context.Context, credential string) (string, *entity.User, error) {
	if uc.google == nil {
		return "", nil, domain.NewValidation("Googleログインは現在利用できません")
	}
	claims, err := uc.google.Verify(ctx, credential)
	if err != nil {
		return "", nil, domain.NewValidation("Google認証に失敗しました")
	}

	u, err := uc.users.FindByGoogleID(ctx, claims.Sub)
	if err != nil {
		return "", nil, err
	}
	if u == nil {
		// Google側で所有確認済みのメールのみ既存アカウント紐付け/新規作成を許可
		if !claims.EmailVerified {
			return "", nil, domain.NewForbidden("Googleアカウントのメールアドレスが確認されていません")
		}
		email := strings.ToLower(strings.TrimSpace(claims.Email))
		sub := claims.Sub
		u, err = uc.users.FindByEmail(ctx, email)
		if err != nil {
			return "", nil, err
		}
		if u != nil {
			u.GoogleID = &sub
			u.EmailVerified = true
			if err := uc.users.Update(ctx, u); err != nil {
				return "", nil, err
			}
		} else {
			u = &entity.User{
				ID:            auth.NewID(),
				Email:         email,
				Password:      "", // Googleログイン専用 (bcrypt検証は常に失敗するためパスワードログイン不可)
				DisplayName:   claims.Name,
				CharacterType: "cat",
				EmailVerified: true,
				GoogleID:      &sub,
			}
			if err := uc.users.Create(ctx, u); err != nil {
				return "", nil, err
			}
		}
	}

	token, err := uc.tokens.Generate(u.ID, u.Email, uc.now())
	return token, u, err
}

func (uc *AuthUsecase) TestLogin(ctx context.Context, email string) (string, *entity.User, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return "", nil, domain.NewValidation("メールアドレスが必要です")
	}
	u, err := uc.users.FindByEmail(ctx, email)
	if err != nil {
		return "", nil, err
	}
	if u == nil {
		hashed, herr := auth.HashPassword(auth.NewID())
		if herr != nil {
			return "", nil, herr
		}
		name := "E2E Test User"
		u = &entity.User{
			ID:            auth.NewID(),
			Email:         email,
			Password:      hashed,
			DisplayName:   &name,
			CharacterType: "cat",
			EmailVerified: true,
		}
		if err := uc.users.Create(ctx, u); err != nil {
			return "", nil, err
		}
	}
	token, err := uc.tokens.Generate(u.ID, u.Email, uc.now())
	return token, u, err
}

// ResendCode は認証コードを再送する
func (uc *AuthUsecase) ResendCode(ctx context.Context, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	u, err := uc.users.FindByEmail(ctx, email)
	if err != nil || u == nil || u.EmailVerified {
		return nil // 列挙防止
	}
	code := auth.NewVerificationCode()
	expiry := uc.now().Add(10 * time.Minute)
	u.VerificationCode = &code
	u.VerificationExpiry = &expiry
	if err := uc.users.Update(ctx, u); err != nil {
		return err
	}
	return uc.mail.SendVerificationCode(ctx, email, code)
}

// ForgotPassword はパスワード再設定コードを送信する
func (uc *AuthUsecase) ForgotPassword(ctx context.Context, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	u, err := uc.users.FindByEmail(ctx, email)
	if err != nil || u == nil {
		return nil // 列挙防止
	}
	code := auth.NewVerificationCode()
	expiry := uc.now().Add(10 * time.Minute)
	u.ResetCode = &code
	u.ResetCodeExpiry = &expiry
	if err := uc.users.Update(ctx, u); err != nil {
		return err
	}
	return uc.mail.SendResetCode(ctx, email, code)
}

// ResetPassword は再設定コードを検証し新パスワードを設定する
func (uc *AuthUsecase) ResetPassword(ctx context.Context, email, code, newPassword string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	u, err := uc.users.FindByEmail(ctx, email)
	if err != nil {
		return err
	}
	if u == nil || u.ResetCode == nil || u.ResetCodeExpiry == nil ||
		*u.ResetCode != code || uc.now().After(*u.ResetCodeExpiry) {
		return domain.NewValidation("再設定コードが正しくないか、有効期限が切れています")
	}
	hashed, err := auth.HashPassword(newPassword)
	if err != nil {
		return err
	}
	u.Password = hashed
	u.ResetCode = nil
	u.ResetCodeExpiry = nil
	return uc.users.Update(ctx, u)
}
