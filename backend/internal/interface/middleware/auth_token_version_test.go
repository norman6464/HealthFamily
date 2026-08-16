package middleware

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/pkg/auth"
)

// トークンに載った版番号と、保存されている版番号を突き合わせる。
//
// これが無いと、パスワードを再設定しても攻撃者のトークンが最大7日間
// そのまま通る。署名は正しいので、署名検証だけでは弾けない。

type stubVersionLookup struct {
	version int
	err     error
	calls   int
	gotID   string
}

func (s *stubVersionLookup) TokenVersion(_ context.Context, userID string) (int, error) {
	s.calls++
	s.gotID = userID
	return s.version, s.err
}

func newAuthEngine(tm *auth.TokenManager, lookup TokenVersionLookup) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/protected", Auth(tm, lookup), func(c *gin.Context) {
		c.String(http.StatusOK, UserID(c))
	})
	return r
}

func request(r *gin.Engine, token string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func tokenFor(t *testing.T, tm *auth.TokenManager, version int) string {
	t.Helper()
	token, err := tm.Generate("u-1", "user@example.com", version, time.Now())
	if err != nil {
		t.Fatalf("トークン発行: %v", err)
	}
	return token
}

func TestAuth_版番号が一致すれば通す(t *testing.T) {
	tm := auth.NewTokenManager("test-secret-test-secret-test-secret", time.Hour)
	lookup := &stubVersionLookup{version: 3}

	w := request(newAuthEngine(tm, lookup), tokenFor(t, tm, 3))

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if lookup.gotID != "u-1" {
		t.Errorf("問い合わせた利用者 = %q", lookup.gotID)
	}
}

// 攻撃の再現。パスワード再設定で版番号が繰り上がった後、
// 攻撃者が握っているトークンは通らなくなる。
func TestAuth_版番号が古いトークンは拒む(t *testing.T) {
	tm := auth.NewTokenManager("test-secret-test-secret-test-secret", time.Hour)
	stolen := tokenFor(t, tm, 3)
	// 被害者がパスワードを再設定した
	lookup := &stubVersionLookup{version: 4}

	w := request(newAuthEngine(tm, lookup), stolen)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401。パスワードを変えても攻撃者を追い出せない", w.Code)
	}
}

// 版番号を詐称して新しい値を名乗っても、署名が変わるので通らない。
// 念のため「大きい値なら通る」実装になっていないことを確かめる。
func TestAuth_版番号が進んだトークンも拒む(t *testing.T) {
	tm := auth.NewTokenManager("test-secret-test-secret-test-secret", time.Hour)
	lookup := &stubVersionLookup{version: 3}

	w := request(newAuthEngine(tm, lookup), tokenFor(t, tm, 99))

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
}

// 版番号を持たない古いトークンは 0 として扱う。
// 「クレームが無ければ照合を飛ばす」にすると、クレームを落とすだけで
// 失効を回避できてしまう。
func TestAuth_版番号クレームが無いトークンは0として扱う(t *testing.T) {
	tm := auth.NewTokenManager("test-secret-test-secret-test-secret", time.Hour)

	t.Run("保存側も0なら通す", func(t *testing.T) {
		w := request(newAuthEngine(tm, &stubVersionLookup{version: 0}), tokenFor(t, tm, 0))
		if w.Code != http.StatusOK {
			t.Errorf("status = %d, want 200", w.Code)
		}
	})

	t.Run("保存側が進んでいれば拒む", func(t *testing.T) {
		w := request(newAuthEngine(tm, &stubVersionLookup{version: 1}), tokenFor(t, tm, 0))
		if w.Code != http.StatusUnauthorized {
			t.Errorf("status = %d, want 401", w.Code)
		}
	})
}

// 利用者が消えていれば通さない。
// 見つからないときに素通しすると、退会したアカウントのトークンが生き続ける。
func TestAuth_利用者が見つからなければ拒む(t *testing.T) {
	tm := auth.NewTokenManager("test-secret-test-secret-test-secret", time.Hour)
	lookup := &stubVersionLookup{err: ErrUserNotFound}

	w := request(newAuthEngine(tm, lookup), tokenFor(t, tm, 0))

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
}

// DB 障害を「認証成功」に倒すと、DB を落とせば誰でも入れてしまう。
// かといって 401 にすると、利用者には「ログインし直せば直る」ように見えて
// 何度やっても入れない。区別できる 503 を返す。
func TestAuth_問い合わせに失敗したら503(t *testing.T) {
	tm := auth.NewTokenManager("test-secret-test-secret-test-secret", time.Hour)
	lookup := &stubVersionLookup{err: errors.New("connection refused")}

	w := request(newAuthEngine(tm, lookup), tokenFor(t, tm, 0))

	if w.Code == http.StatusOK {
		t.Fatal("DB 障害で素通しした。DB を落とせば誰でも入れる")
	}
	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("status = %d, want 503", w.Code)
	}
}

// 署名が壊れているトークンでは、DB に問い合わせるまでもない。
// 問い合わせてしまうと、でたらめなトークンを投げるだけで DB を叩ける。
func TestAuth_署名が無効ならDBに問い合わせない(t *testing.T) {
	tm := auth.NewTokenManager("test-secret-test-secret-test-secret", time.Hour)
	lookup := &stubVersionLookup{version: 0}

	w := request(newAuthEngine(tm, lookup), "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.bogus")

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
	if lookup.calls != 0 {
		t.Errorf("無効なトークンで DB に %d 回問い合わせた", lookup.calls)
	}
}

func TestAuth_ヘッダが無ければDBに問い合わせない(t *testing.T) {
	tm := auth.NewTokenManager("test-secret-test-secret-test-secret", time.Hour)
	lookup := &stubVersionLookup{version: 0}

	w := request(newAuthEngine(tm, lookup), "")

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
	if lookup.calls != 0 {
		t.Errorf("ヘッダ無しで DB に %d 回問い合わせた", lookup.calls)
	}
}

var _ = entity.User{}
