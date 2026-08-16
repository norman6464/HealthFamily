package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

// 本番で実際に成立していた回避の再現。
//
// gin の既定はすべてのプロキシを信頼し、X-Forwarded-For の左端 (クライアントが
// 自由に書ける値) を接続元として採る。1リクエストごとに違う値を名乗るだけで
// 毎回まっさらな枠が割り当てられ、上限が存在しないのと同じになっていた。
//
// これが通ると 6 桁の再設定コードを総当たりでき、メールアドレスを知っている
// だけで任意アカウントのパスワードを差し替えられる。
func TestRateLimitIgnoresSpoofedForwardedFor(t *testing.T) {
	gin.SetMode(gin.TestMode)

	const limit = 5
	r := gin.New()
	r.POST("/api/auth/reset-password",
		RateLimit("spoof-test", limit, time.Minute, nil),
		func(c *gin.Context) { c.Status(http.StatusOK) })

	send := func(forwardedFor string) int {
		req := httptest.NewRequest("POST", "/api/auth/reset-password", nil)
		req.RemoteAddr = "169.254.1.1:8080"
		// 右端は Cloud Run が足した実接続元。左側は攻撃者が名乗る値
		req.Header.Set("X-Forwarded-For", forwardedFor+", 203.0.113.10")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w.Code
	}

	for i := range limit {
		if code := send("10.0.0.1"); code != http.StatusOK {
			t.Fatalf("上限内の %d 回目で %d が返った", i+1, code)
		}
	}

	// ここから名乗る値を毎回変える。実接続元は変わっていない
	for i := range 10 {
		if code := send("10.0.0." + string(rune('2'+i))); code != http.StatusTooManyRequests {
			t.Fatalf("ヘッダを変えるだけで上限を回避できた (%d 回目に %d)", i+1, code)
		}
	}
}

// 実際に別の利用者なら、巻き添えにしない。
// 「全部まとめて絞る」だけなら安全だが、それはサービス停止と変わらない。
func TestRateLimitStillSeparatesRealClients(t *testing.T) {
	gin.SetMode(gin.TestMode)

	const limit = 5
	r := gin.New()
	r.POST("/api/auth/forgot-password",
		RateLimit("separation-test", limit, time.Minute, nil),
		func(c *gin.Context) { c.Status(http.StatusOK) })

	send := func(clientIP string) int {
		req := httptest.NewRequest("POST", "/api/auth/forgot-password", nil)
		req.RemoteAddr = "169.254.1.1:8080"
		req.Header.Set("X-Forwarded-For", clientIP)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w.Code
	}

	for range limit {
		send("203.0.113.10")
	}
	if code := send("203.0.113.10"); code != http.StatusTooManyRequests {
		t.Fatalf("使い切った利用者が止まっていない: %d", code)
	}
	if code := send("203.0.113.11"); code != http.StatusOK {
		t.Fatalf("別の利用者が巻き添えになっている: %d", code)
	}
}
