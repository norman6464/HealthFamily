package middleware

import (
	"net"
	"net/http"
	"strings"
)

// ResolveClientIP はレート制限の識別子に使う接続元を返す。
//
// Cloud Run のフロントエンドは X-Forwarded-For の「右端」に実際の接続元を足す。
// クライアントが自分で付けた値は必ずその左側に残るため、右端だけを見れば詐称できない。
//
// gin の ClientIP() は既定ですべてのプロキシ (0.0.0.0/0) を信頼し、
// 右から左へ走査して最後まで到達した結果「左端」を返す。左端はクライアントが
// 自由に書ける値なので、ヘッダを1リクエストごとに変えるだけで上限が消えていた。
// 6桁コードの総当たりがそのまま通る状態だったため、ここは gin に任せない。
//
// リバースプロキシを増やす場合は「右端が自分たちの基盤が付けた値である」ことが
// 前提になる。前段を足すときは、この関数と一緒に見直すこと。
func ResolveClientIP(r *http.Request) string {
	if ip := rightmostForwardedFor(r.Header.Get("X-Forwarded-For")); ip != "" {
		return ip
	}
	// ヘッダが無い・壊れている場合は接続元に退避する。
	// 「識別できないから通す」ではなく「まとめて絞る」側に倒す
	return remoteAddrIP(r.RemoteAddr)
}

// rightmostForwardedFor は X-Forwarded-For の右端を返す。IP として読めなければ空文字。
//
// 右端が壊れている場合に左へ遡らないのは、遡った先がクライアントの書いた値であり、
// 壊れた値を送るだけで好きな識別子を名乗れてしまうため。
func rightmostForwardedFor(header string) string {
	if header == "" {
		return ""
	}
	hops := strings.Split(header, ",")
	last := strings.TrimSpace(hops[len(hops)-1])
	if last == "" {
		return ""
	}
	// "[2001:db8::1]:443" のような形も受け付ける
	if host, _, err := net.SplitHostPort(last); err == nil {
		last = host
	}
	if net.ParseIP(last) == nil {
		return ""
	}
	return last
}

func remoteAddrIP(remoteAddr string) string {
	if host, _, err := net.SplitHostPort(remoteAddr); err == nil {
		return host
	}
	return remoteAddr
}
