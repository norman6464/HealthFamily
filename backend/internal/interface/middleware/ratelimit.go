package middleware

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"healthfamily/internal/pkg/response"
)

// インメモリのレート制限。Next.js版 checkRateLimit と同等の挙動。

type rateEntry struct {
	count   int
	resetAt time.Time
}

type rateLimiter struct {
	mu     sync.Mutex
	store  map[string]*rateEntry
	max    int
	window time.Duration
}

var limiters sync.Map // name -> *rateLimiter

func getLimiter(name string, max int, window time.Duration) *rateLimiter {
	if v, ok := limiters.Load(name); ok {
		return v.(*rateLimiter)
	}
	rl := &rateLimiter{store: make(map[string]*rateEntry), max: max, window: window}
	actual, _ := limiters.LoadOrStore(name, rl)
	return actual.(*rateLimiter)
}

func (rl *rateLimiter) allow(key string, now time.Time) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()
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
			key = c.ClientIP()
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
