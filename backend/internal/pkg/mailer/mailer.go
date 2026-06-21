package mailer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Mailer はメール送信の抽象
type Mailer interface {
	SendVerificationCode(ctx context.Context, to, code string) error
	SendResetCode(ctx context.Context, to, code string) error
}

// ResendMailer は Resend API を使ったメール送信実装
type ResendMailer struct {
	apiKey string
	from   string
	client *http.Client
}

func NewResendMailer(apiKey, from string) *ResendMailer {
	return &ResendMailer{apiKey: apiKey, from: from, client: &http.Client{Timeout: 10 * time.Second}}
}

func (m *ResendMailer) send(ctx context.Context, to, subject, html string) error {
	// APIキー未設定時は開発用にログ出力のみ（送信スキップ）
	if m.apiKey == "" {
		fmt.Printf("[mailer] (skipped, no API key) to=%s subject=%s\n", to, subject)
		return nil
	}
	payload, _ := json.Marshal(map[string]any{
		"from": m.from, "to": []string{to}, "subject": subject, "html": html,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+m.apiKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := m.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("resend api error: status %d", resp.StatusCode)
	}
	return nil
}

func (m *ResendMailer) SendVerificationCode(ctx context.Context, to, code string) error {
	html := fmt.Sprintf(`<p>HealthFamily 認証コード: <strong>%s</strong></p><p>10分以内に入力してください。</p>`, code)
	return m.send(ctx, to, "HealthFamily 認証コード", html)
}

func (m *ResendMailer) SendResetCode(ctx context.Context, to, code string) error {
	html := fmt.Sprintf(`<p>HealthFamily パスワード再設定コード: <strong>%s</strong></p><p>10分以内に入力してください。</p>`, code)
	return m.send(ctx, to, "HealthFamily パスワード再設定", html)
}
