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
	// E2Eテスト用ログインバイパスの共有シークレット。空なら無効(本番)。
	E2ETestLoginSecret string
	// 自分たちの基盤が X-Forwarded-For に足す段数。
	// Cloud Run に直接ぶら下げるなら 1、前段が無ければ 0。
	// 既定を 0 にしているのは、設定し忘れたときに「クライアントの言い値を信じる」
	// 側へ倒れると、ヘッダを名乗るだけでレート制限を回避されるため。
	TrustedProxyHops int
}

// trustedProxyHops は TRUSTED_PROXY_HOPS を読む。
// 未設定・不正な値・負の値は 0 (ヘッダを信用しない) として扱う。
func trustedProxyHops() int {
	raw := os.Getenv("TRUSTED_PROXY_HOPS")
	if raw == "" {
		return 0
	}
	n, err := strconv.Atoi(strings.TrimSpace(raw))
	if err != nil || n < 0 {
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
		E2ETestLoginSecret: os.Getenv("E2E_TEST_LOGIN_SECRET"),
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
