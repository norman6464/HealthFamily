package googleauth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

// TokenEndpoint は Google の本番トークンエンドポイント
const TokenEndpoint = "https://oauth2.googleapis.com/token"

// codeVerifier の長さ。RFC 7636 が定める範囲
const (
	minVerifierLength = 43
	maxVerifierLength = 128
)

// CodeGrant はブラウザから受け取る認可コードグラント一式。
//
// ブラウザが持つのはここにある 3 つだけで、ID トークンもリフレッシュトークンも渡らない。
// 交換に必要な client_secret はサーバーしか知らないため、
// 認可コードが漏れても第三者はトークンにできない。
type CodeGrant struct {
	Code         string
	CodeVerifier string
	RedirectURI  string
}

// Validate は Google へ投げる前に形式を確かめる。
//
// code_verifier の長さを見るのは、短い合言葉を許すと PKCE が
// 総当たり可能になり、認可コード横取りを防げなくなるため。
func (g CodeGrant) Validate() error {
	if strings.TrimSpace(g.Code) == "" {
		return errors.New("認可コードが指定されていません")
	}
	if strings.TrimSpace(g.RedirectURI) == "" {
		return errors.New("リダイレクトURIが指定されていません")
	}
	n := len(g.CodeVerifier)
	if n < minVerifierLength || n > maxVerifierLength {
		return fmt.Errorf("code_verifier は %d〜%d 文字である必要があります", minVerifierLength, maxVerifierLength)
	}
	return nil
}

// Exchanger は認可コードを ID トークンに交換する抽象 (テストで差し替え可能にする)
type Exchanger interface {
	Exchange(ctx context.Context, grant CodeGrant) (string, error)
}

type exchanger struct {
	clientID     string
	clientSecret string
	endpoint     string
	client       *http.Client
}

// NewExchanger は Google のトークンエンドポイントと通信する Exchanger を返す。
func NewExchanger(clientID, clientSecret, endpoint string, client *http.Client) Exchanger {
	if endpoint == "" {
		endpoint = TokenEndpoint
	}
	if client == nil {
		client = http.DefaultClient
	}
	return &exchanger{clientID: clientID, clientSecret: clientSecret, endpoint: endpoint, client: client}
}

func (e *exchanger) Exchange(ctx context.Context, grant CodeGrant) (string, error) {
	if err := grant.Validate(); err != nil {
		return "", err
	}

	form := url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {grant.Code},
		"code_verifier": {grant.CodeVerifier},
		"redirect_uri":  {grant.RedirectURI},
		"client_id":     {e.clientID},
		"client_secret": {e.clientSecret},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, e.endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return "", fmt.Errorf("build token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err := e.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("exchange authorization code: %w", err)
	}
	defer func() { _ = res.Body.Close() }()

	// 応答は素直に読み切る。上限を設けるのは、壊れた相手に無限に付き合わないため
	body, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return "", fmt.Errorf("read token response: %w", err)
	}

	if res.StatusCode != http.StatusOK {
		// Google の応答本文はそのまま返さない。利用者に見せる情報ではないうえ、
		// ここを素通しすると内部の設定が応答に混ざりうる
		return "", fmt.Errorf("google token endpoint returned %d", res.StatusCode)
	}

	var payload struct {
		IDToken string `json:"id_token"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return "", fmt.Errorf("decode token response: %w", err)
	}
	if payload.IDToken == "" {
		return "", errors.New("google token response has no id_token")
	}
	return payload.IDToken, nil
}
