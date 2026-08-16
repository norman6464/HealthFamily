package googleauth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

// 認可コードグラントの肝は「交換をサーバー間で行い、ID トークンをブラウザに渡さない」こと。
// ブラウザが受け取るのは一度きりの認可コードだけで、それ単体では
// client_secret と code_verifier が無ければトークンにならない。
func TestExchangerSendsTheRightRequest(t *testing.T) {
	var got url.Values
	var contentType string

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			t.Errorf("フォームを読めない: %v", err)
		}
		got = r.PostForm
		contentType = r.Header.Get("Content-Type")
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"id_token": "the-id-token"})
	}))
	defer server.Close()

	ex := NewExchanger("client-id", "client-secret", server.URL, http.DefaultClient)
	idToken, err := ex.Exchange(context.Background(), CodeGrant{
		Code:         "the-code",
		CodeVerifier: strings.Repeat("v", 43),
		RedirectURI:  "https://app.example.com/auth/callback",
	})
	if err != nil {
		t.Fatalf("交換に失敗: %v", err)
	}

	if idToken != "the-id-token" {
		t.Errorf("id_token = %q, want %q", idToken, "the-id-token")
	}
	if !strings.HasPrefix(contentType, "application/x-www-form-urlencoded") {
		t.Errorf("Content-Type = %q", contentType)
	}

	// PKCE の合言葉を送らないと、盗まれた認可コードだけで交換が通ってしまう
	for key, want := range map[string]string{
		"grant_type":    "authorization_code",
		"code":          "the-code",
		"code_verifier": strings.Repeat("v", 43),
		"redirect_uri":  "https://app.example.com/auth/callback",
		"client_id":     "client-id",
		"client_secret": "client-secret",
	} {
		if got.Get(key) != want {
			t.Errorf("%s = %q, want %q", key, got.Get(key), want)
		}
	}
}

func TestExchangerRejectsGoogleErrors(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error":"invalid_grant"}`))
	}))
	defer server.Close()

	ex := NewExchanger("client-id", "client-secret", server.URL, http.DefaultClient)
	_, err := ex.Exchange(context.Background(), CodeGrant{
		Code:         "used-already",
		CodeVerifier: strings.Repeat("v", 43),
		RedirectURI:  "https://app.example.com/auth/callback",
	})
	if err == nil {
		t.Fatal("Google が拒否したのに成功として扱っている")
	}
}

// Google の応答に id_token が無いのに成功扱いすると、空文字を検証しにいって
// 分かりにくい失敗になる。ここで止める。
func TestExchangerRequiresIDToken(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"access_token":"only-this"}`))
	}))
	defer server.Close()

	ex := NewExchanger("client-id", "client-secret", server.URL, http.DefaultClient)
	if _, err := ex.Exchange(context.Background(), CodeGrant{
		Code:         "c",
		CodeVerifier: strings.Repeat("v", 43),
		RedirectURI:  "https://app.example.com/auth/callback",
	}); err == nil {
		t.Fatal("id_token が無いのに成功として扱っている")
	}
}

func TestCodeGrantValidation(t *testing.T) {
	cases := map[string]CodeGrant{
		"コードが空":            {Code: "", CodeVerifier: strings.Repeat("v", 43), RedirectURI: "https://a.example.com/cb"},
		"code_verifier が空": {Code: "c", CodeVerifier: "", RedirectURI: "https://a.example.com/cb"},
		"code_verifier が短い": {Code: "c", CodeVerifier: strings.Repeat("v", 42), RedirectURI: "https://a.example.com/cb"},
		"code_verifier が長い": {Code: "c", CodeVerifier: strings.Repeat("v", 129), RedirectURI: "https://a.example.com/cb"},
		"redirect_uri が空":  {Code: "c", CodeVerifier: strings.Repeat("v", 43), RedirectURI: ""},
	}

	for name, grant := range cases {
		t.Run(name, func(t *testing.T) {
			if err := grant.Validate(); err == nil {
				t.Error("不正な入力を受け入れている")
			}
		})
	}
}

func TestCodeGrantAcceptsValidInput(t *testing.T) {
	// RFC 7636 は code_verifier を 43〜128 文字と定める
	for _, length := range []int{43, 128} {
		grant := CodeGrant{
			Code:         "c",
			CodeVerifier: strings.Repeat("v", length),
			RedirectURI:  "https://a.example.com/cb",
		}
		if err := grant.Validate(); err != nil {
			t.Errorf("長さ %d を拒否している: %v", length, err)
		}
	}
}
