package middleware

import (
	"net/http/httptest"
	"testing"
)

// レート制限の識別子は、攻撃者が書き換えられない値でなければ意味がない。
//
// Cloud Run のフロントエンドは X-Forwarded-For の「右端」に実際の接続元を足す。
// クライアントが自分で付けた値は必ずその左側に残るので、右端だけを見れば詐称できない。
// gin の既定はすべてのプロキシを信頼して「左端」を採るため、
// ヘッダを1リクエストごとに変えるだけで上限が消えていた。
func TestResolveClientIP(t *testing.T) {
	cases := []struct {
		name       string
		forwardedFor string
		remoteAddr string
		want       string
	}{
		{
			name:         "ヘッダが無ければ接続元をそのまま使う",
			forwardedFor: "",
			remoteAddr:   "203.0.113.10:54321",
			want:         "203.0.113.10",
		},
		{
			name:         "1段なら、その値が実クライアント",
			forwardedFor: "203.0.113.10",
			remoteAddr:   "169.254.1.1:8080",
			want:         "203.0.113.10",
		},
		{
			name:         "詐称された値を左に並べられても、右端を採る",
			forwardedFor: "1.2.3.4, 5.6.7.8, 203.0.113.10",
			remoteAddr:   "169.254.1.1:8080",
			want:         "203.0.113.10",
		},
		{
			name:         "空白の入り方が違っても揺れない",
			forwardedFor: "1.2.3.4,203.0.113.10",
			remoteAddr:   "169.254.1.1:8080",
			want:         "203.0.113.10",
		},
		{
			name:         "IPv6 でも同じ",
			forwardedFor: "1.2.3.4, 2001:db8::1",
			remoteAddr:   "169.254.1.1:8080",
			want:         "2001:db8::1",
		},
		{
			name:         "右端が IP として壊れていれば接続元へ退避する",
			forwardedFor: "203.0.113.10, not-an-ip",
			remoteAddr:   "169.254.1.1:8080",
			want:         "169.254.1.1",
		},
		{
			name:         "空要素だけを並べても接続元へ退避する",
			forwardedFor: " , ",
			remoteAddr:   "169.254.1.1:8080",
			want:         "169.254.1.1",
		},
		{
			name:         "ポートが付いていない接続元も扱える",
			forwardedFor: "",
			remoteAddr:   "203.0.113.10",
			want:         "203.0.113.10",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("POST", "/api/auth/forgot-password", nil)
			req.RemoteAddr = tc.remoteAddr
			if tc.forwardedFor != "" {
				req.Header.Set("X-Forwarded-For", tc.forwardedFor)
			}

			if got := ResolveClientIP(req); got != tc.want {
				t.Errorf("ResolveClientIP() = %q, want %q", got, tc.want)
			}
		})
	}
}

// 攻撃の再現。ヘッダを毎回変えても、同じ枠として数えられなければならない。
func TestRotatingForwardedHeaderCannotCreateNewBudgets(t *testing.T) {
	seen := map[string]bool{}

	for i := range 20 {
		req := httptest.NewRequest("POST", "/api/auth/reset-password", nil)
		req.RemoteAddr = "169.254.1.1:8080"
		// 攻撃者が名乗る値だけを変える。右端は Cloud Run が足した実接続元で固定
		req.Header.Set("X-Forwarded-For", "10.0.0."+string(rune('0'+i%10))+", 203.0.113.10")
		seen[ResolveClientIP(req)] = true
	}

	if len(seen) != 1 {
		t.Errorf("識別子が %d 種類に分かれた。ヘッダを変えるだけで上限を回避できる: %v", len(seen), seen)
	}
}

// X-Real-IP も同じ理由で信用しない。クライアントが自由に付けられる。
func TestRealIPHeaderIsIgnored(t *testing.T) {
	req := httptest.NewRequest("POST", "/api/auth/login", nil)
	req.RemoteAddr = "203.0.113.10:1234"
	req.Header.Set("X-Real-IP", "1.2.3.4")

	if got := ResolveClientIP(req); got != "203.0.113.10" {
		t.Errorf("X-Real-IP を信用している: %q", got)
	}
}
