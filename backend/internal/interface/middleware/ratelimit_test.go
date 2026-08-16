package middleware

import (
	"testing"
	"time"
)

// レート制限そのものが期待どおり効くこと。
func TestRateLimiter_上限を超えたら拒否する(t *testing.T) {
	rl := &rateLimiter{store: map[string]*rateEntry{}, max: 3, window: time.Minute}
	now := time.Now()

	for i := 1; i <= 3; i++ {
		if !rl.allow("k", now) {
			t.Fatalf("%d 回目は通るべき", i)
		}
	}
	if rl.allow("k", now) {
		t.Fatal("4 回目は拒否すべき")
	}
}

func TestRateLimiter_窓が過ぎたら回復する(t *testing.T) {
	rl := &rateLimiter{store: map[string]*rateEntry{}, max: 1, window: time.Minute}
	now := time.Now()

	rl.allow("k", now)
	if rl.allow("k", now) {
		t.Fatal("窓の中では拒否すべき")
	}
	if !rl.allow("k", now.Add(2*time.Minute)) {
		t.Fatal("窓が過ぎたら通すべき")
	}
}

func TestRateLimiter_キーごとに独立している(t *testing.T) {
	rl := &rateLimiter{store: map[string]*rateEntry{}, max: 1, window: time.Minute}
	now := time.Now()

	rl.allow("a", now)
	if !rl.allow("b", now) {
		t.Fatal("別のキーは影響を受けない")
	}
}

// 期限切れのエントリが溜まり続けてはならない。
//
// 認証前のエンドポイントは IP をキーにするため、IP を変えながら叩かれると
// エントリが無限に増える。256MiB のコンテナではメモリを食い潰されうる。
func TestRateLimiter_期限切れのエントリを溜め込まない(t *testing.T) {
	rl := &rateLimiter{store: map[string]*rateEntry{}, max: 10, window: time.Minute}
	base := time.Now()

	// 1万個の別々のキーで、それぞれ 1 回ずつ叩く
	for i := 0; i < 10000; i++ {
		rl.allow(uniqueKey(i), base)
	}
	if got := rl.size(); got != 10000 {
		t.Fatalf("この時点では 10000 件あるはず: %d", got)
	}

	// 窓が過ぎたあと、新しいキーで 1 回叩く
	rl.allow("after", base.Add(2*time.Minute))

	if got := rl.size(); got > 100 {
		t.Fatalf("期限切れのエントリが回収されていない: %d 件残っている", got)
	}
}

func TestRateLimiter_回収しても有効なエントリは残す(t *testing.T) {
	rl := &rateLimiter{store: map[string]*rateEntry{}, max: 10, window: time.Minute}
	base := time.Now()

	rl.allow("old", base)                       // 2分後には期限切れ
	rl.allow("fresh", base.Add(90*time.Second)) // 2分後もまだ有効

	rl.allow("trigger", base.Add(2*time.Minute))

	if _, ok := rl.store["fresh"]; !ok {
		t.Fatal("まだ有効なエントリを消してはならない")
	}
	if _, ok := rl.store["old"]; ok {
		t.Fatal("期限切れのエントリは消すべき")
	}
}

func uniqueKey(i int) string {
	return "key-" + string(rune('a'+i%26)) + "-" + itoa(i)
}

func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	var b []byte
	for i > 0 {
		b = append([]byte{byte('0' + i%10)}, b...)
		i /= 10
	}
	return string(b)
}
