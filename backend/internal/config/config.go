package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config はアプリケーション全体の設定を保持する
type Config struct {
	Port           string
	DatabaseURL    string
	JWTSecret      string
	AllowedOrigins []string
	ResendAPIKey   string
	MailFrom       string
	AppBaseURL     string
	// Google OIDC ログイン用 OAuth クライアントID。空なら Google ログイン無効。
	GoogleClientID string
	// 認可コードグラント用のクライアントシークレット。
	// 空なら /google/callback は無効。ID トークン方式 (/google) だけが残る。
	GoogleClientSecret string
	// 自分たちの基盤が X-Forwarded-For に足す段数。
	// Cloud Run に直接ぶら下げるなら 1、前段が無ければ 0。
	// 既定を 0 にしているのは、設定し忘れたときに「クライアントの言い値を信じる」
	// 側へ倒れると、ヘッダを名乗るだけでレート制限を回避されるため。
	TrustedProxyHops int
}

// trustedProxyHops は、自分たちの基盤が X-Forwarded-For に足す段数を決める。
//
// 設定を人手に委ねると、付け忘れた瞬間に静かに壊れる。Cloud Run 上で 0 だと
// 全利用者が 1 つの枠を共有し、数人が使っただけで全員が締め出される。
// 逆に前段の無い環境で 1 だと、ヘッダを名乗るだけで上限を回避される。
// どちらも設定ミスで起きてはならないので、実行環境から既定を決める。
//
// K_SERVICE は Cloud Run が必ず設定する。実行環境が与えるものであり
// リクエストから注入できないため、判定の根拠にしてよい。
// TRUSTED_PROXY_HOPS を明示すればそちらが優先される。
func trustedProxyHops() int {
	fallback := 0
	if os.Getenv("K_SERVICE") != "" {
		// Cloud Run のフロントエンドが右端に実接続元を足す
		fallback = 1
	}

	raw := strings.TrimSpace(os.Getenv("TRUSTED_PROXY_HOPS"))
	if raw == "" {
		return fallback
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		// 壊れた値で緩む側にも絞りすぎる側にも倒さず、環境から決めた既定に戻す
		return fallback
	}
	if n < 0 {
		return 0
	}
	return n
}

// Load は環境変数から設定を読み込む
func Load() (*Config, error) {
	cfg := &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		ResendAPIKey:       os.Getenv("RESEND_API_KEY"),
		MailFrom:           getEnv("MAIL_FROM", "HealthFamily <onboarding@resend.dev>"),
		AppBaseURL:         getEnv("APP_BASE_URL", "http://localhost:5173"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		TrustedProxyHops:   trustedProxyHops(),
	}

	origins := getEnv("ALLOWED_ORIGINS", "http://localhost:5173")
	for _, o := range strings.Split(origins, ",") {
		if trimmed := strings.TrimSpace(o); trimmed != "" {
			cfg.AllowedOrigins = append(cfg.AllowedOrigins, trimmed)
		}
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
