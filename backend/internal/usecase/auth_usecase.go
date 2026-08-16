package usecase

import (
	"context"
	"crypto/subtle"
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
	// nil なら認可コードグラントは無効。ID トークン方式とは別に設定する
	exchange googleauth.Exchanger
	now      func() time.Time
	// verifyPassword は「bcryptが何回・どのハッシュで走ったか」をテストから
	// 観測するための差し替え口。実測時間に頼るテストは環境依存で不安定になり、
	// タイミング対策が外れても気づけないため、この観測点を置いている。
	// nil のときは本物へ落ちる (passwordVerifier を参照)。
	verifyPassword func(hashed, plain string) bool
}

// passwordVerifier は差し替えが無ければ本物の bcrypt 照合を返す。
//
// NewAuthUsecase を通さず AuthUsecase{...} を直接組まれても、nil を呼んで
// 落ちたり、パスワード照合そのものが素通りになったりしないようにする。
func (uc *AuthUsecase) passwordVerifier() func(hashed, plain string) bool {
	if uc.verifyPassword == nil {
		return auth.VerifyPassword
	}
	return uc.verifyPassword
}

// WithGoogleExchanger は認可コードグラントを有効にする。
//
// client_secret を持つ設定でのみ呼ぶ。設定しなければ /google/callback は
// 「利用できません」を返すだけで、中途半端に動くことはない。
func (uc *AuthUsecase) WithGoogleExchanger(ex googleauth.Exchanger) *AuthUsecase {
	uc.exchange = ex
	return uc
}

// LoginWithGoogleCode は認可コードグラント (PKCE) でログインする。
//
// ブラウザから受け取るのは一度きりの認可コードだけで、ID トークンはここで
// サーバー間通信により取得する。client_secret を知らない第三者は、
// 認可コードを盗んでもトークンに換えられない。
func (uc *AuthUsecase) LoginWithGoogleCode(ctx context.Context, grant googleauth.CodeGrant) (string, *entity.User, error) {
	if uc.exchange == nil {
		return "", nil, domain.NewValidation("Googleログインは現在利用できません")
	}
	// Google へ投げる前に形式を確かめる。壊れた入力を外部へ運ぶ理由がない
	if err := grant.Validate(); err != nil {
		return "", nil, domain.NewValidation("Google認証に失敗しました")
	}

	idToken, err := uc.exchange.Exchange(ctx, grant)
	if err != nil {
		// Google の応答内容は利用者に返さない。設定や状態が応答に混ざりうる
		return "", nil, domain.NewValidation("Google認証に失敗しました")
	}
	return uc.LoginWithGoogle(ctx, idToken)
}

func NewAuthUsecase(users repository.UserRepository, tokens *auth.TokenManager, mail mailer.Mailer, google googleauth.Verifier) *AuthUsecase {
	return &AuthUsecase{users: users, tokens: tokens, mail: mail, google: google, now: time.Now}
}

// MaxCodeAttempts は 1 つのコードに対して許す失敗回数。
//
// コードは100万通りしかない。IP 単位の制限だけでは、攻撃者が IP を分散させれば
// 現実的な時間で尽くせてしまうので、アカウント側でも数える。
//
// アカウントを凍結するのではなくコードを捨てるのは、凍結だと第三者が
// でたらめなコードを送りつけるだけで任意の利用者を締め出せてしまうため。
// コードを捨てる方式なら、本人は再送を受け取ればやり直せる。
const MaxCodeAttempts = 5

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
	// 存在しないユーザーと、コードが合わないユーザーは同じ結果にする（列挙防止）。
	// ここで分岐すると「そのメールアドレスは登録済みか」が漏れる。
	const invalidCode = "認証コードが正しくないか、有効期限が切れています"

	// 認証済みかどうかに関わらず、必ずコードを検証する。
	// 以前はここで EmailVerified を見て検証を飛ばしていたため、
	// メールアドレスを知っているだけで任意のアカウントのトークンを発行できた。
	if u == nil ||
		u.VerificationCode == nil || u.VerificationExpiry == nil ||
		subtle.ConstantTimeCompare([]byte(*u.VerificationCode), []byte(code)) != 1 ||
		uc.now().After(*u.VerificationExpiry) {
		// 当たりうるコードが生きているときだけ数える。無い・期限切れなら
		// どんな入力も当たりようがなく、数えると「でたらめなアドレスを投げるだけで
		// 書き込みを起こせる」経路になる
		if u != nil && u.VerificationCode != nil && u.VerificationExpiry != nil &&
			!uc.now().After(*u.VerificationExpiry) {
			u.VerificationAttempts++
			if u.VerificationAttempts >= MaxCodeAttempts {
				u.VerificationCode = nil
				u.VerificationExpiry = nil
			}
			// 保存しなければ次のリクエストで数え直しになり、上限が効かない
			if err := uc.users.Update(ctx, u); err != nil {
				return "", nil, err
			}
		}
		return "", nil, domain.NewValidation(invalidCode)
	}

	u.EmailVerified = true
	u.VerificationCode = nil
	u.VerificationExpiry = nil
	u.VerificationAttempts = 0
	if err := uc.users.Update(ctx, u); err != nil {
		return "", nil, err
	}
	token, err := uc.tokens.Generate(u.ID, u.Email, u.TokenVersion, uc.now())
	return token, u, err
}

// Login はメール・パスワードを検証しJWTを発行する
func (uc *AuthUsecase) Login(ctx context.Context, email, password string) (string, *entity.User, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	u, err := uc.users.FindByEmail(ctx, email)
	if err != nil {
		return "", nil, err
	}
	// 照合対象が無い場合もダミーハッシュで bcrypt を必ず1回走らせる。
	// || の短絡評価で照合を飛ばすと、未登録メールへの応答だけ数百ms速くなる。
	// 応答の中身は登録済みの場合と揃えてあるが、揃っているのは中身だけで、
	// 時間差が残る限りそこから「そのアドレスは登録済みか」を読み取れてしまう。
	hashed := auth.DummyPasswordHash
	loginable := u != nil && u.Password != ""
	if loginable {
		hashed = u.Password
	}
	if !uc.passwordVerifier()(hashed, password) || !loginable {
		return "", nil, domain.NewValidation("メールアドレスまたはパスワードが正しくありません")
	}
	if !u.EmailVerified {
		return "", nil, domain.NewForbidden("メールアドレスが認証されていません")
	}
	token, err := uc.tokens.Generate(u.ID, u.Email, u.TokenVersion, uc.now())
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
				ID:    auth.NewID(),
				Email: email,
				// パスワード未設定。Login は空を見てダミーハッシュで照合したうえで、
				// 照合結果によらず拒否するため、パスワードではログインできない
				Password:      "",
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

	token, err := uc.tokens.Generate(u.ID, u.Email, u.TokenVersion, uc.now())
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
	token, err := uc.tokens.Generate(u.ID, u.Email, u.TokenVersion, uc.now())
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
	// 新しいコードには新しい枠を与える。戻さないと、総当たりを受けた本人が
	// 再送を受け取っても永久にやり直せなくなる
	u.VerificationAttempts = 0
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
	u.ResetAttempts = 0
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
	// コードの比較は定数時間で行う。通常の文字列比較は先頭一致の長さで
	// 応答時間が変わるため、6桁のコードを1桁ずつ絞り込まれうる。
	if u == nil || u.ResetCode == nil || u.ResetCodeExpiry == nil ||
		subtle.ConstantTimeCompare([]byte(*u.ResetCode), []byte(code)) != 1 ||
		uc.now().After(*u.ResetCodeExpiry) {
		// 試行回数はメール認証とは別に数える。片方への攻撃で、
		// もう片方まで本人が使えなくなるのを避けるため
		if u != nil && u.ResetCode != nil && u.ResetCodeExpiry != nil &&
			!uc.now().After(*u.ResetCodeExpiry) {
			u.ResetAttempts++
			if u.ResetAttempts >= MaxCodeAttempts {
				u.ResetCode = nil
				u.ResetCodeExpiry = nil
			}
			if err := uc.users.Update(ctx, u); err != nil {
				return err
			}
		}
		return domain.NewValidation("再設定コードが正しくないか、有効期限が切れています")
	}
	hashed, err := auth.HashPassword(newPassword)
	if err != nil {
		return err
	}
	u.Password = hashed
	u.ResetCode = nil
	u.ResetCodeExpiry = nil
	u.ResetAttempts = 0
	if err := uc.users.Update(ctx, u); err != nil {
		return err
	}
	// 発行済みトークンを失効させる。パスワードを変えたのに攻撃者が
	// 有効期限(7日)まで居座れるなら、乗っ取られた利用者に打つ手が無い。
	//
	// 繰り上げるのは照合に成功した後だけ。失敗でも動かすと、第三者が
	// でたらめなコードを送りつけるだけで任意の利用者を締め出せてしまう。
	//
	// 加算は DB 内で行う。読み出した値に足して書き戻すと、
	// 上げる前の値を握った並行リクエストに巻き戻される
	return uc.users.BumpTokenVersion(ctx, u.ID)
}
