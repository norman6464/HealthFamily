package middleware

import (
	"net/http/httptest"
	"testing"
)

// レート制限の識別子は、攻撃者が書き換えられない値でなければ意味がない。
//
// X-Forwarded-For はクライアントが自由に書ける。信用してよいのは
// 「自分たちの基盤が付け足した分」だけで、それが何段あるかは配置で決まる。
// 段数を設定として明示し、既定は 0 (ヘッダを一切信用しない) にする。
//
// 「前段に必ずプロキシがいる」を暗黙の前提にすると、直接到達できる経路が
// できた瞬間に、ヘッダを名乗るだけで上限を回避されるのに誰も気づけない。
func TestResolveClientIP(t *testing.T) {
	cases := []struct {
		name         string
		trustedHops  int
		forwardedFor string
		remoteAddr   string
		want         string
	}{
		{
			name:         "段数0ならヘッダを一切見ない",
			trustedHops:  0,
			forwardedFor: "1.2.3.4",
			remoteAddr:   "203.0.113.10:54321",
			want:         "203.0.113.10",
		},
		{
			name:         "段数0では、何を名乗られても接続元だけを見る",
			trustedHops:  0,
			forwardedFor: "1.2.3.4, 5.6.7.8, 9.9.9.9",
			remoteAddr:   "203.0.113.10:54321",
			want:         "203.0.113.10",
		},
		{
			name:         "段数1なら右端を採る",
			trustedHops:  1,
			forwardedFor: "203.0.113.10",
			remoteAddr:   "169.254.1.1:8080",
			want:         "203.0.113.10",
		},
		{
			name:         "段数1で、詐称された値を左に並べられても右端を採る",
			trustedHops:  1,
			forwardedFor: "1.2.3.4, 5.6.7.8, 203.0.113.10",
			remoteAddr:   "169.254.1.1:8080",
			want:         "203.0.113.10",
		},
		{
			name:         "段数2なら右から2番目を採る",
			trustedHops:  2,
			forwardedFor: "1.2.3.4, 203.0.113.10, 10.0.0.1",
			remoteAddr:   "169.254.1.1:8080",
			want:         "203.0.113.10",
		},
		{
			name:         "空白の入り方が違っても揺れない",
			trustedHops:  1,
			forwardedFor: "1.2.3.4,203.0.113.10",
			remoteAddr:   "169.254.1.1:8080",
			want:         "203.0.113.10",
		},
		{
			name:         "IPv6 でも同じ",
			trustedHops:  1,
			forwardedFor: "1.2.3.4, 2001:db8::1",
			remoteAddr:   "169.254.1.1:8080",
			want:         "2001:db8::1",
		},
		{
			name:         "段数より要素が少なければ接続元へ退避する",
			trustedHops:  2,
			forwardedFor: "203.0.113.10",
			remoteAddr:   "169.254.1.1:8080",
			want:         "169.254.1.1",
		},
		{
			name:         "採るべき位置が IP として壊れていれば接続元へ退避する",
			trustedHops:  1,
			forwardedFor: "203.0.113.10, not-an-ip",
			remoteAddr:   "169.254.1.1:8080",
			want:         "169.254.1.1",
		},
		{
			name:         "ヘッダが無ければ接続元をそのまま使う",
			trustedHops:  1,
			forwardedFor: "",
			remoteAddr:   "203.0.113.10:54321",
			want:         "203.0.113.10",
		},
		{
			name:         "ポートが付いていない接続元も扱える",
			trustedHops:  0,
			forwardedFor: "",
			remoteAddr:   "203.0.113.10",
			want:         "203.0.113.10",
		},
		{
			name:         "負の段数は 0 として扱う",
			trustedHops:  -1,
			forwardedFor: "1.2.3.4",
			remoteAddr:   "203.0.113.10:54321",
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

			if got := ResolveClientIP(req, tc.trustedHops); got != tc.want {
				t.Errorf("ResolveClientIP(hops=%d) = %q, want %q", tc.trustedHops, got, tc.want)
			}
		})
	}
}

// 攻撃の再現。ヘッダを毎回変えても、同じ枠として数えられなければならない。
func TestRotatingForwardedHeaderCannotCreateNewBudgets(t *testing.T) {
	for _, hops := range []int{0, 1} {
		seen := map[string]bool{}
		for i := range 20 {
			req := httptest.NewRequest("POST", "/api/auth/reset-password", nil)
			req.RemoteAddr = "169.254.1.1:8080"
			spoofed := "10.0.0." + string(rune('0'+i%10))
			if hops == 1 {
				// 基盤が右端に実接続元を足す配置
				req.Header.Set("X-Forwarded-For", spoofed+", 203.0.113.10")
			} else {
				// 前段が無い配置。攻撃者の値しか入らない
				req.Header.Set("X-Forwarded-For", spoofed)
			}
			seen[ResolveClientIP(req, hops)] = true
		}
		if len(seen) != 1 {
			t.Errorf("段数 %d で識別子が %d 種類に分かれた。ヘッダを変えるだけで上限を回避できる: %v",
				hops, len(seen), seen)
		}
	}
}

// X-Real-IP も同じ理由で信用しない。クライアントが自由に付けられる。
func TestRealIPHeaderIsIgnored(t *testing.T) {
	req := httptest.NewRequest("POST", "/api/auth/login", nil)
	req.RemoteAddr = "203.0.113.10:1234"
	req.Header.Set("X-Real-IP", "1.2.3.4")

	for _, hops := range []int{0, 1} {
		if got := ResolveClientIP(req, hops); got != "203.0.113.10" {
			t.Errorf("段数 %d で X-Real-IP を信用している: %q", hops, got)
		}
	}
}
