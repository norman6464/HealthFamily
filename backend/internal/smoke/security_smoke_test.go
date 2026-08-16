// Package smoke は、デプロイ済みのサービスに対して守れていることを確かめる。
//
// 単体テストが通っていても、本番に届いていなければ意味がない。実際に
// 「修正をローカルから直接デプロイ → 別の PR がマージされ、修正の入っていない
// main から自動デプロイされて巻き戻る」という事故が起きた。単体テストは
// 全て緑のまま、本番だけが脆弱な状態に戻っていた。
//
// ここは SMOKE_BASE_URL が指すサービスへ実際にリクエストを投げる。
// 指定が無ければスキップするので、通常の go test ./... では走らない。
package smoke

import (
	"bytes"
	"fmt"
	"net/http"
	"os"
	"testing"
	"time"
)

const (
	// 実在しないアドレス。.invalid は RFC 2606 で予約されており、
	// 誰かに本当のメールが飛ぶことはない
	probeEmail = "deploy-smoke-probe@example.invalid"

	// forgot-password の上限。router.go の ipLimit と揃える
	forgotPasswordLimit = 5
)

func baseURL(t *testing.T) string {
	t.Helper()
	url := os.Getenv("SMOKE_BASE_URL")
	if url == "" {
		t.Skip("SMOKE_BASE_URL が未設定のためスキップする")
	}
	return url
}

func client() *http.Client {
	return &http.Client{Timeout: 30 * time.Second}
}

func postJSON(t *testing.T, url, path, body string, headers map[string]string) int {
	t.Helper()
	req, err := http.NewRequest(http.MethodPost, url+path, bytes.NewBufferString(body))
	if err != nil {
		t.Fatalf("リクエストを組み立てられない: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	res, err := client().Do(req)
	if err != nil {
		t.Fatalf("%s へのリクエストが失敗: %v", path, err)
	}
	defer func() { _ = res.Body.Close() }()
	return res.StatusCode
}

// これが落ちたら、メールアドレスを知っているだけで任意アカウントを
// 乗っ取れる状態になっている。デプロイを止めること。
func TestRateLimitCannotBeBypassedByForwardedHeader(t *testing.T) {
	url := baseURL(t)

	// 上限まで使い切る。ヘッダは毎回変えるが、実接続元は同じ
	for i := range forgotPasswordLimit {
		code := postJSON(t, url, "/api/auth/forgot-password",
			fmt.Sprintf(`{"email":%q}`, probeEmail),
			map[string]string{"X-Forwarded-For": fmt.Sprintf("192.0.2.%d", i+1)})
		if code != http.StatusOK {
			t.Fatalf("上限内の %d 回目で %d が返った。前提が崩れている", i+1, code)
		}
	}

	// ここから先は、名乗る値を変えても止まらなければならない
	for i := range 5 {
		code := postJSON(t, url, "/api/auth/forgot-password",
			fmt.Sprintf(`{"email":%q}`, probeEmail),
			map[string]string{"X-Forwarded-For": fmt.Sprintf("198.51.100.%d", i+1)})
		if code != http.StatusTooManyRequests {
			t.Fatalf(
				"X-Forwarded-For を変えるだけでレート制限を回避できる (%d 回目に %d)。"+
					"6桁コードの総当たりが通り、任意アカウントを乗っ取られる",
				i+1, code)
		}
	}
}

// 認証コードを検証せずにトークンを出していないか。
// 移植元にはこの穴があり、メールアドレスだけで他人になりすませた。
func TestVerifyDoesNotIssueTokenForBogusCode(t *testing.T) {
	url := baseURL(t)

	code := postJSON(t, url, "/api/auth/verify",
		fmt.Sprintf(`{"email":%q,"code":"000000"}`, probeEmail), nil)

	if code == http.StatusOK {
		t.Fatal("でたらめなコードで認証が通った。認証バイパスが復活している")
	}
	if code != http.StatusBadRequest && code != http.StatusTooManyRequests {
		t.Errorf("想定外の応答: %d", code)
	}
}

func TestProtectedEndpointsRequireAuth(t *testing.T) {
	url := baseURL(t)

	for _, path := range []string{"/api/members", "/api/medications", "/api/users/me"} {
		req, err := http.NewRequest(http.MethodGet, url+path, nil)
		if err != nil {
			t.Fatalf("リクエストを組み立てられない: %v", err)
		}
		res, err := client().Do(req)
		if err != nil {
			t.Fatalf("%s へのリクエストが失敗: %v", path, err)
		}
		status := res.StatusCode
		_ = res.Body.Close()

		if status != http.StatusUnauthorized {
			t.Errorf("%s がトークン無しで %d を返した。認可が外れている", path, status)
		}
	}
}

// 署名を検証せずにトークンを受け入れていないか
func TestForgedTokenIsRejected(t *testing.T) {
	url := baseURL(t)

	forged := []struct {
		name  string
		token string
	}{
		{"署名が壊れている", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ4In0.invalid"},
		{"alg:none", "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ4In0."},
		{"JWT ですらない", "not-a-token"},
	}

	for _, f := range forged {
		t.Run(f.name, func(t *testing.T) {
			req, err := http.NewRequest(http.MethodGet, url+"/api/users/me", nil)
			if err != nil {
				t.Fatalf("リクエストを組み立てられない: %v", err)
			}
			req.Header.Set("Authorization", "Bearer "+f.token)
			res, err := client().Do(req)
			if err != nil {
				t.Fatalf("リクエストが失敗: %v", err)
			}
			status := res.StatusCode
			_ = res.Body.Close()

			if status != http.StatusUnauthorized {
				t.Errorf("偽造トークンが %d で通った", status)
			}
		})
	}
}

func TestHealthCheckResponds(t *testing.T) {
	url := baseURL(t)

	res, err := client().Get(url + "/health")
	if err != nil {
		t.Fatalf("/health に到達できない: %v", err)
	}
	defer func() { _ = res.Body.Close() }()

	if res.StatusCode != http.StatusOK {
		t.Errorf("/health = %d", res.StatusCode)
	}
}
