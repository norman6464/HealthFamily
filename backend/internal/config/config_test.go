package config

import "testing"

// 信頼するプロキシ段数。
//
// 設定を人手に委ねると、付け忘れた瞬間に静かに壊れる。0 のままだと
// Cloud Run 上では全利用者が 1 つの枠を共有し、数人が使っただけで
// 全員が締め出される。1 を既定にすると、前段の無い環境で
// ヘッダを名乗るだけで上限を回避される。どちらも設定ミスで起きてはならない。
//
// Cloud Run は K_SERVICE を必ず設定する。これは実行環境が与えるもので
// リクエストから注入できないため、判定の根拠にしてよい。
func TestTrustedProxyHops(t *testing.T) {
	cases := []struct {
		name string
		env  map[string]string
		want int
	}{
		{
			name: "Cloud Run 上では既定で1段",
			env:  map[string]string{"K_SERVICE": "healthfamily-api"},
			want: 1,
		},
		{
			name: "前段の無い環境では既定で0段",
			env:  map[string]string{},
			want: 0,
		},
		{
			name: "明示した値が優先される",
			env:  map[string]string{"K_SERVICE": "healthfamily-api", "TRUSTED_PROXY_HOPS": "2"},
			want: 2,
		},
		{
			name: "Cloud Run 上でも0を明示できる",
			env:  map[string]string{"K_SERVICE": "healthfamily-api", "TRUSTED_PROXY_HOPS": "0"},
			want: 0,
		},
		{
			name: "壊れた値は既定に落とす",
			env:  map[string]string{"K_SERVICE": "healthfamily-api", "TRUSTED_PROXY_HOPS": "いくつか"},
			want: 1,
		},
		{
			name: "負の値は0として扱う",
			env:  map[string]string{"TRUSTED_PROXY_HOPS": "-3"},
			want: 0,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("K_SERVICE", "")
			t.Setenv("TRUSTED_PROXY_HOPS", "")
			for k, v := range tc.env {
				t.Setenv(k, v)
			}

			if got := trustedProxyHops(); got != tc.want {
				t.Errorf("trustedProxyHops() = %d, want %d", got, tc.want)
			}
		})
	}
}
