package middleware

import (
	"net"
	"net/http"
	"strings"
)

// ResolveClientIP はレート制限の識別子に使う接続元を返す。
//
// X-Forwarded-For はクライアントが自由に書ける。信用してよいのは
// 「自分たちの基盤が付け足した分」だけで、それが何段あるかは配置で決まる。
// trustedHops はその段数。Cloud Run に直接ぶら下げる場合は 1
// (フロントエンドが右端に実接続元を足す)。前段が無ければ 0。
//
// 0 のときはヘッダを一切見ない。「前段に必ずプロキシがいる」を暗黙の前提に
// すると、直接到達できる経路ができた瞬間に、ヘッダを名乗るだけで上限を
// 回避されるのに誰も気づけない。設定し忘れたときは緩む側ではなく絞る側に倒す。
//
// gin の ClientIP() を使わないのは、既定で全プロキシ (0.0.0.0/0) を信頼し、
// 右から左へ走査した末に「左端」を返すため。左端はクライアントの言い値であり、
// 実際にこれで認証系のレート制限が丸ごと無効になっていた。
func ResolveClientIP(r *http.Request, trustedHops int) string {
	if ip := forwardedForAt(r.Header.Get("X-Forwarded-For"), trustedHops); ip != "" {
		return ip
	}
	// 識別できないときは通し放題にせず、接続元単位でまとめて絞る
	return remoteAddrIP(r.RemoteAddr)
}

// forwardedForAt は、右から trustedHops 番目 (1 始まり) の値を返す。
// 段数が 0 以下、要素が足りない、IP として読めない場合は空文字。
//
// 足りないときに左へ遡らないのは、遡った先がクライアントの書いた値であり、
// 短いヘッダを送るだけで好きな識別子を名乗れてしまうため。
func forwardedForAt(header string, trustedHops int) string {
	if trustedHops <= 0 || header == "" {
		return ""
	}
	hops := strings.Split(header, ",")
	idx := len(hops) - trustedHops
	if idx < 0 {
		return ""
	}
	candidate := strings.TrimSpace(hops[idx])
	if candidate == "" {
		return ""
	}
	// "[2001:db8::1]:443" のような形も受け付ける
	if host, _, err := net.SplitHostPort(candidate); err == nil {
		candidate = host
	}
	if net.ParseIP(candidate) == nil {
		return ""
	}
	return candidate
}

func remoteAddrIP(remoteAddr string) string {
	if host, _, err := net.SplitHostPort(remoteAddr); err == nil {
		return host
	}
	return remoteAddr
}
