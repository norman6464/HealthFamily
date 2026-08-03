package config

import (
	"fmt"
	"os"
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
	// E2Eテスト用ログインバイパスの共有シークレット。空なら無効(本番)。
	E2ETestLoginSecret string
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
		E2ETestLoginSecret: os.Getenv("E2E_TEST_LOGIN_SECRET"),
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
