package middleware

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"healthfamily/internal/pkg/response"
)

// インメモリのレート制限。
//
// 制限はプロセス内で完結するため、インスタンスが複数あると実効上限は
// 「設定値 × インスタンス数」になる。現在は max 2 インスタンスなので、
// 設定値はその前提で決めること。厳密な全体制限が必要になったら、
// 共有ストア(Memorystore 等)か、前段のロードバランサ側での制限へ移す。

type rateEntry struct {
	count   int
	resetAt time.Time
}

type rateLimiter struct {
	mu     sync.Mutex
	store  map[string]*rateEntry
	max    int
	window time.Duration

	// 最後に期限切れエントリを回収した時刻
	lastSweep time.Time
}

// 回収の実行間隔。毎回全走査すると重いので間隔を空ける
const sweepInterval = time.Minute

var limiters sync.Map // name -> *rateLimiter

func getLimiter(name string, max int, window time.Duration) *rateLimiter {
	if v, ok := limiters.Load(name); ok {
		return v.(*rateLimiter)
	}
	rl := &rateLimiter{store: make(map[string]*rateEntry), max: max, window: window}
	actual, _ := limiters.LoadOrStore(name, rl)
	return actual.(*rateLimiter)
}

// sweepLocked は期限切れのエントリを取り除く。呼び出し側でロックを取っていること。
//
// これが無いと、認証前のエンドポイント(キーは IP)を IP を変えながら叩かれた場合に
// エントリが無限に増え、メモリを食い潰される。
func (rl *rateLimiter) sweepLocked(now time.Time) {
	if now.Sub(rl.lastSweep) < sweepInterval {
		return
	}
	rl.lastSweep = now
	for k, e := range rl.store {
		if now.After(e.resetAt) {
			delete(rl.store, k)
		}
	}
}

// size は保持しているエントリ数を返す。
func (rl *rateLimiter) size() int {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	return len(rl.store)
}

func (rl *rateLimiter) allow(key string, now time.Time) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	rl.sweepLocked(now)
	entry, ok := rl.store[key]
	if !ok || now.After(entry.resetAt) {
		rl.store[key] = &rateEntry{count: 1, resetAt: now.Add(rl.window)}
		return true
	}
	if entry.count >= rl.max {
		return false
	}
	entry.count++
	return true
}

// RateLimit はユーザーIDまたはIP単位でリクエストを制限する。
// keyFunc が空文字を返した場合はIPアドレスをキーに使う。
func RateLimit(name string, max int, window time.Duration, keyFunc func(c *gin.Context) string) gin.HandlerFunc {
	rl := getLimiter(name, max, window)
	return func(c *gin.Context) {
		key := ""
		if keyFunc != nil {
			key = keyFunc(c)
		}
		if key == "" {
			// gin の ClientIP() は使わない。既定ですべてのプロキシを信頼し、
			// クライアントが自由に書ける X-Forwarded-For の左端を返すため、
			// ヘッダを変えるだけで上限を回避できてしまう
			key = ResolveClientIP(c.Request)
		}
		if !rl.allow(name+":"+key, time.Now()) {
			response.Error(c, 429, "リクエストが多すぎます。しばらくしてから再試行してください。")
			c.Abort()
			return
		}
		c.Next()
	}
}

// PerUser はログイン済みユーザーID単位のレート制限キーを返す
func PerUser(c *gin.Context) string {
	return UserID(c)
}
