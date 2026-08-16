# Go / Java 応答差分の検証設計

切り替え前のゲートとして使う。両実装を同じ DB・同じ入力で走らせ、応答を突き合わせる。

両バックエンドを実際に起動して挙動を確認したうえで設計しました。以下、実測に基づく設計です。

---

# Go / Java 応答差分検証ハーネス 設計

## 0. 前提として実測で確認した事実

設計の土台になるので先に列挙します（すべてこの環境で実行して確認済み）。

| 確認項目 | 結果 |
|---|---|
| Go 版が compose の PostgreSQL (`localhost:55432`) で起動するか | **起動する**。`MIGRATIONS_DIR` を渡しても `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` なので schema.sql 焼き込み済み DB に対して no-op |
| Go のルート総数 | **106**（`GET /health` と `POST /api/auth/test-login` を含む。test-login は `E2E_TEST_LOGIN_SECRET` 設定時のみ登録されるので、本番相当だと 105） |
| Java 版のビルド | `./mvnw package -DskipTests` で jar 生成可。**ただし jOOQ codegen が compose の DB を読むので、DB が起動していないとビルド自体が失敗する** |
| Java 版の起動 | `java -jar target/healthfamily-api-0.0.1-SNAPSHOT.jar` で起動。`spring-boot:run` はプラグイン依存の解決が別途必要なので CI では jar 推奨 |
| **Go が発行したトークンを Java が受理するか** | **する**。`JWT_SECRET` を揃えた状態で Go の `/api/auth/test-login` が返したトークンで Java の `/api/members` が 200 を返した |
| Java 実装済みコントローラ | auth / member / medication / prescription の **4 つのみ**（106 中 十数エンドポイント程度）。残りは未移植 |

さらに、**ハーネスを作る前から見えている差分**が既にあります（後述の §9）。これは「作れば必ず検出できるものが実在する」という意味で、設計の妥当性の裏付けになります。

---

## 1. 全体構成

**2 モード構成**にします。副作用の扱いを分けるのが要点です。

### モード R: read-parity（共有 DB・GET のみ）
1 つの DB に現実的なデータを流し込み、**両実装に同じ GET を投げて即座に比較**する。副作用がないので順序も状態も問題にならない。安く速く、最初に通すべきゲート。

### モード W: write-parity（DB 分離・ロックステップ）
`healthfamily_go` / `healthfamily_java` の**2 つの DB に分離**し、同じスキーマ・同じシードから開始。各ステップを両方へ送り、応答を即比較。書き込み系はこちら。

```
                      ┌─────────────┐
   scenario step ────►│  Go :18080  │──► healthfamily_go
        │             └─────────────┘
        │             ┌─────────────┐
        └────────────►│ Java :18081 │──► healthfamily_java
                      └─────────────┘
                            │
                    正規化 → 突き合わせ → 差分レポート
```

**「DB をリセットして実装ごとに 2 回再生する」方式は採りません。** 理由は、Go が発行した UUID と Java が発行した UUID は必ず違うので、後続ステップで `{{memberId}}` を参照するときに結局実装ごとに別の値を保持する必要があり、それなら最初から DB を分けてロックステップで進めたほうが単純だからです。加えて、ロックステップだと**差分が出た瞬間にどのステップで壊れたかが確定する**（再生方式だと全部走らせてから突き合わせるので、最初の差分以降のカスケードを人間が読み解くことになる）。

---

## 2. 認証をどうするか

### 結論: ハーネスが自前で HS256 トークンを署名する

両実装のログイン API に依存させてはいけません。理由:

- Go 版のログイン導線は `POST /api/auth/login`（email/password）と `POST /api/auth/google`（ID トークン直渡し）
- Java 版は `POST /api/auth/google/callback`（**認可コードグラント + PKCE**）のみ
- つまり**ログイン導線そのものが別物**で、ここを比較の土台にすると土台ごと崩れる

`POST /api/auth/test-login`（`E2E_TEST_LOGIN_SECRET`）は Go にしかないので、これも使えません。

そこで、ハーネス内で直接署名します。`backend` モジュール内に置けば `github.com/golang-jwt/jwt/v5` がそのまま使えます。

```go
// parity/internal/token.go
func Mint(secret []byte, userID, email string, now time.Time) string {
	claims := jwt.MapClaims{
		"sub":   userID, // Java の JwtAuthenticationConverter が principal に使う
		"uid":   userID, // Go の auth.Claims が使う
		"email": email,
		"iat":   now.Unix(),
		"exp":   now.Add(1 * time.Hour).Unix(),
	}
	s, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(secret)
	if err != nil {
		panic(err)
	}
	return s
}
```

**必須の注意点**: `JWT_SECRET` は **32 バイト以上**にすること。Java 側は `HmacAccessTokenIssuer` が明示的に拒否し、`NimbusJwtDecoder.withSecretKey` も HS256 で 256bit 未満の鍵を受け付けません。Go 側には長さ制約がないので、短い鍵にすると「Go だけ起動して Java が落ちる」という分かりにくい失敗になります。検証では `parity-secret-0123456789abcdefghij`（34 バイト）を使いました。

### 認証系エンドポイント自体の比較

`/api/auth/*` は「対応表」で個別に扱い、自動掃引の対象外にします。片方にしかないものが大半なので、機械比較しても意味のあるシグナルが出ません。代わりに**明示的な対応表を人間が書き、その表自体をレビュー対象にする**のが正直な扱い方です。

```go
// parity/authmap.go
var AuthEndpointMap = []AuthPair{
	{Go: "POST /api/auth/login",           Java: "", Note: "Java は Google のみ。移行時に導線ごと変える判断が必要"},
	{Go: "POST /api/auth/google",          Java: "POST /api/auth/google/callback",
	 Note: "Go=IDトークン直受け / Java=認可コード+PKCE。プロトコルが違うのでレスポンス比較のみ手動で行う"},
	{Go: "POST /api/auth/signup",          Java: "", Note: "未移植"},
	// ...
}
```

---

## 3. 揺らぐ値の正規化

### 基本方針: パース済み JSON で比較する（バイト比較は不可能）

実測で確認したとおり、キー順が根本的に違います。

```
Go:   {"data":{...},"success":true}          ← gin.H は map → encoding/json が辞書順にソート
Java: {"success":true,"data":{...}}          ← record の宣言順
```

### 正規化ポリシー: 「値はクラス化、形式は保持」の 2 層

単純に ID や日時を伏せ字にすると、**本物のバグまで一緒に伏せてしまいます**。そこで値と形式を分離します。

#### 3-1. ID: 出現順プレースホルダ（構造は保つ）

UUID / cuid 形状の文字列を、**そのシナリオ実行内での初出順**に `<id:1>`, `<id:2>` … へ置き換える。同じ ID が 2 回出てくれば 2 回とも `<id:1>` になるので、**参照関係が壊れていれば検出できる**。単なる伏せ字より格段に強い。

```go
func (n *Norm) id(s string) string {
	if p, ok := n.ids[s]; ok {
		return p
	}
	n.next++
	p := fmt.Sprintf("<id:%d>", n.next)
	n.ids[s] = p
	return p
}
```

**シードで投入する固定 ID は UUID 形状にしない**（`u_owner`, `m_mother` のようにする）。そうすれば正規化器が触らず、レポート上でそのまま読めます。これは地味ですが効きます。

#### 3-2. 日時: 形式クラス + 値クラス

これが一番厄介で、一番重要です。実測値:

```
Go   POST /api/members → "birthDate":"1960-04-01T09:00:00+09:00"
                         "createdAt":"2026-08-16T14:51:34.261073+09:00"
Java POST /api/members → "birthDate":"1960-04-01"
```

`birthDate` は**形式が違うだけでなくフロントの解釈が変わる本物の破壊的差分**です。伏せてはいけません。一方 `createdAt` のマイクロ秒は当然ずれるので、そこは無視したい。

そこで `<形式クラス|値クラス>` の形に落とします。

| 入力 | 正規化結果 |
|---|---|
| `2026-08-16T14:51:34.261073+09:00`（実行時刻の窓内） | `<ts:dt+offset.us\|now>` |
| `2026-08-16T05:51:34.261073Z`（同上） | `<ts:dt+Z.us\|now>` |
| `1960-04-01T09:00:00+09:00` | `<ts:dt+offset.s\|1960-04-01>` |
| `1960-04-01` | `<ts:date\|1960-04-01>` |

- **値部分**: 実行開始〜終了の時刻ウィンドウ内なら `now`。それ以外は日付まで丸めた実値を残す。
- **形式部分**: 常に保持。

結果として、`birthDate` は「値は同じだが形式が違う」と報告され、`createdAt` は形式が同じなら一致する。欲しい挙動そのものです。

オフセット表記 (`+09:00`) と Z 表記を同一視したい場合のために `PARITY_TIME_FORMAT=lenient` を用意し、既定は `strict` にします。既定を厳しくしておくのが安全側です。

#### 3-3. 数値

Go の `encoding/json` は全部 `float64`、Java は `Integer` / `BigDecimal`。`1` と `1.0` を同一視するため、整数値の float は整数文字列へ寄せます。

#### 3-4. null と「キーの欠落」は正規化しない

これも本物の差分です。Go の `response.Success(c, nil)` は `"data":null` を出しますが、Java の `ApiResponse` は `@JsonInclude(NON_NULL)` なので `data` キーごと消えます。実際 `PUT /api/prescriptions/{id}/items` は Go が処方箋オブジェクトを返し、Java は `ApiResponse.ok(null)` で `{"success":true}` を返します。フロントが `data` を読んでいれば壊れる。**必ず差分として報告させること。**

#### 3-5. 配列順序

既定は**順序込みで比較**。順序が仕様として未定義の一覧だけ、ステップ単位でソートキーを明示します。既定を「順序無視」にすると、`displayOrder` を持つ薬一覧のような**順序が仕様である**エンドポイントの回帰を見逃します。

#### 3-6. フィールド単位の上書き

```go
Norm: map[string]Policy{
	"$.data[*].age":       PolicyIgnore,        // 実行日で変わる派生値
	"$.data[*].createdAt": PolicyTimeLenient,
	"$.data":              PolicySortBy("id"),
}
```

---

## 4. 副作用のある操作の扱い

### 4-1. DB 分離 + ステップごとの変数バインディングを実装別に持つ

これが副作用問題の核です。

```go
vars := map[Impl]map[string]string{ImplGo: {}, ImplJava: {}}
// POST /api/members の応答から
//   vars[ImplGo]["memberId"]   = "500cfbce-..."   (Go が採番)
//   vars[ImplJava]["memberId"] = "9bec5bd7-..."   (Java が採番)
// 次のステップ GET /api/members/{{memberId}} は実装ごとに別 URL になる
```

こうすると ID 差分が後続ステップを汚しません。

### 4-2. シナリオ間はリセット、シナリオ内は順序依存を明示

- **シナリオ間**: 毎回 TRUNCATE + 共通シード再投入 → シナリオは互いに独立。実行順に依存しない。
- **シナリオ内**: `Steps` は順序ありの配列。順序依存は型で表現されているので、暗黙にならない。

リセット SQL（テーブル名はハードコードせず動的取得。テーブル追加時に更新漏れが起きないように）:

```sql
SET lock_timeout = '5s';   -- 接続が滞留していたら黙って固まらせず即失敗させる
DO $$
DECLARE stmt text;
BEGIN
  SELECT 'TRUNCATE ' || string_agg(format('%I.%I', schemaname, tablename), ', ')
         || ' RESTART IDENTITY CASCADE'
    INTO stmt
    FROM pg_tables WHERE schemaname = 'public';
  IF stmt IS NOT NULL THEN EXECUTE stmt; END IF;
END $$;
```

TRUNCATE は ACCESS EXCLUSIVE ロックを取りますが、両サーバのコネクションはアイドル（トランザクション外）なのでブロックしません。ロックステップ実行なのでリセット中に飛んでいるリクエストもありません。

### 4-3. DB 状態も比較する

**応答が一致しても書き込みが違うことがあります。** 例えば Java の `MemberUseCase.View` には `updatedAt` が無いので、`updatedAt` を更新し忘れていても応答比較では絶対に検出できません。

シナリオ末尾で両 DB をダンプして突き合わせます。

```sql
SELECT jsonb_agg(to_jsonb(t) ORDER BY t.id) FROM "Member" t;
```

正規化は応答と同じパイプラインを通します（UUID → `<id:N>`、timestamptz → 時刻クラス）。これで「応答は同じだが DB が違う」を捕まえられます。

### 4-4. 差分が出たらシナリオを打ち切る

ステータスコードが違う、あるいは片方だけエラーになった時点で、以降のステップの比較結果は意味を持ちません。`Fatal` 判定で打ち切り、レポートには「ここで打ち切り」と明記します。差分の洪水を防ぎます。

---

## 5. レート制限（これを踏まないと必ずハマる）

Go 側:
- 認証済み API 全体: `RateLimit("api", 120, time.Minute, PerUser)` → **1 ユーザー 120 req/min**
- 認証系: signup 10/min, login 20/min, resend/forgot/reset 5/min（**IP 単位**）

Java 側: **レート制限なし**。

106 エンドポイント × 数ステップ = 300〜500 リクエストなので、**全掃引すると Go だけ 429 を返し、大量の偽差分が出ます**。

### 対策（3 つ併用）

**(a) Go に env 上書きを足す（推奨・小さい変更）**

`/Users/takuma.kawano/HealthFamily/backend/internal/config/config.go`:
```go
RateLimitMax: getEnvInt("RATE_LIMIT_MAX", 120),
```
`router.Setup` に渡して `middleware.RateLimit("api", cfg.RateLimitMax, ...)` にする。パリティ実行時は `RATE_LIMIT_MAX=100000`。

**(b) シナリオごとに別ユーザーを使う**

`api` リミッタは per-user なので、シナリオごとに `u_s001_owner` のようなユーザーを切れば実質リセットされます。ただし**認証系の IP 単位リミッタには効きません**（ハーネスは常に 127.0.0.1）。(a) と併用が必要。

**(c) レート制限そのものを差分項目として扱う**

Java に制限が無いのは隠すべきことではなく**報告すべき差分**です。専用シナリオを 1 本置き、既定設定の Go に 130 連射して 429 が返ること、Java が 200 を返し続けることを差分として出させます。切替判断の材料になります。

---

## 6. 起動方法（実測済みコマンド）

### 共通の前提: TZ を両方 `Asia/Tokyo` に固定する

**これは必須です。** 実測で Go は timestamptz を**プロセスのローカル TZ** でレンダリングしました（`2026-08-16T14:51:34.261073+09:00`）。`TZ=UTC` で起動すると `Z` 表記になり、それだけで全タイムスタンプが差分になります。Java 側は `AppZone` が `Asia/Tokyo` 固定、`ClockConfig` は `Clock.systemUTC()`。アプリのドメイン基準に合わせて**両方 `Asia/Tokyo`** にします。

なお **Go には Clock 注入がありません**（`time.Now()` 直呼び）。固定時刻にはできないので、時刻は「凍結」ではなく「実行ウィンドウによる正規化」で吸収します（§3-2）。Java の `ClockConfig` もパリティ実行では差し替えず、素の `systemUTC` のままにします。両方を実時計で走らせるのが、比較としては最も素直です。

### DB の準備

```bash
cd /Users/takuma.kawano/HealthFamily/backend-java
docker compose up -d
# healthy 待ち
until docker compose exec -T postgres pg_isready -U healthfamily -d healthfamily >/dev/null 2>&1; do sleep 1; done
```

Go のマイグレーションは**テンプレート DB に対して 1 回だけ**当て、そのあとクローンします。こうすれば 2 つの DB のスキーマが確実に一致します。

```bash
# 1) テンプレート(healthfamily)に Go のマイグレーションを適用（no-op のはずだが念のため）
#    → Go サーバを MIGRATIONS_DIR 付きで一度起動して落とす、でよい

# 2) クローン
PSQL="docker compose exec -T postgres psql -U healthfamily -d postgres"
$PSQL -c 'DROP DATABASE IF EXISTS healthfamily_go;'
$PSQL -c 'DROP DATABASE IF EXISTS healthfamily_java;'
$PSQL -c 'CREATE DATABASE healthfamily_go   TEMPLATE healthfamily;'
$PSQL -c 'CREATE DATABASE healthfamily_java TEMPLATE healthfamily;'
```

### Go 版

```bash
cd /Users/takuma.kawano/HealthFamily/backend
go build -o /tmp/hf-parity-go ./cmd/server     # go run より速い。毎回コンパイルしない

TZ=Asia/Tokyo \
GIN_MODE=release \
PORT=18080 \
DATABASE_URL="postgres://healthfamily:healthfamily@localhost:55432/healthfamily_go?sslmode=disable" \
JWT_SECRET="$PARITY_JWT_SECRET" \
RATE_LIMIT_MAX=100000 \
ALLOWED_ORIGINS=http://localhost:5173 \
/tmp/hf-parity-go &
# MIGRATIONS_DIR は「渡さない」。クローン元で適用済みで、両DBを同一に保つため
# E2E_TEST_LOGIN_SECRET も「渡さない」。本番相当のルート集合にするため
```

ヘルスチェック: `curl -sf http://localhost:18080/health` → `{"status":"ok"}`

### Java 版

```bash
cd /Users/takuma.kawano/HealthFamily/backend-java
export JAVA_HOME=/opt/homebrew/opt/openjdk@25/libexec/openjdk.jdk/Contents/Home  # 環境依存
./mvnw -q package -DskipTests            # ← compose の DB が上がっていないと jOOQ codegen で失敗する

TZ=Asia/Tokyo \
SERVER_PORT=18081 \
DATABASE_JDBC_URL="jdbc:postgresql://localhost:55432/healthfamily_java" \
DATABASE_USER=healthfamily \
DATABASE_PASSWORD=healthfamily \
JWT_SECRET="$PARITY_JWT_SECRET" \
GOOGLE_CLIENT_ID=dummy.apps.googleusercontent.com \
GOOGLE_CLIENT_SECRET=dummy \
"$JAVA_HOME/bin/java" -Duser.timezone=Asia/Tokyo \
  -jar target/healthfamily-api-0.0.1-SNAPSHOT.jar &
```

ヘルスチェック: `curl -sf http://localhost:18081/actuator/health` → `{"status":"UP",...}`

**注意**: この環境では `java` が PATH に無く（Homebrew の `openjdk@25` が未リンク）、`JAVA_HOME` の明示が必要でした。`run.sh` の冒頭で `JAVA_HOME` 未設定なら `/usr/libexec/java_home -v 25` → Homebrew パスの順にフォールバックさせるとよいです。

---

## 7. 実行手段の選択

### 結論: **Go のテスト（`//go:build parity` タグ付き）+ 起動オーケストレーションのシェル 1 本**

比較検討:

| 手段 | 評価 |
|---|---|
| シェル + curl + jq | ID の出現順マッピング、時刻の形式クラス化、再帰的 JSON 正規化を jq で書くのは急速に地獄になる。保守不能。**不採用** |
| **Go テスト** | **採用**。`engine.Routes()` でルート表を直接取れる／正規化ロジックを型付きで書ける／`t.Run` でエンドポイント単位の結果が出る／既存の `go test` と同じ道具 |
| Java テスト | Java 側は 4 コントローラしか無く、比較の主語は「Go の 106 本」。ルート表も Go 側にある。逆立ち |
| 別言語のスクリプト | 3 つ目の言語とツールチェーンを持ち込むコストに見合わない |

**重要な制約**: ハーネスは **`backend` の Go モジュール内**に置く必要があります。ルート表を取るには `healthfamily/internal/interface/router` を import しますが、Go の `internal` パッケージは同一モジュールからしか import できないためです。

置き場所: `/Users/takuma.kawano/HealthFamily/backend/parity/`

`//go:build parity` タグで通常の `go test ./...` から除外し、`go test -tags parity ./parity/...` でのみ走るようにします（外部プロセス 2 つと DB が要るため）。

リポジトリルートに置きたい場合は、代わりに `/Users/takuma.kawano/HealthFamily/backend/cmd/routedump/main.go`（30 行程度、ルートを JSON で標準出力）を足して、別モジュールのハーネスがそれを読む構成にできます。ただし可動部が増えるので、最初は同一モジュール案を推奨します。

### ルート表の自動生成（網羅性の担保）

`router_smoke_test.go` が既に nil 依存でエンジンを組み立てているので、同じ手が使えます。

```go
// parity/catalog/catalog.go
func Routes() []string {
	tm := auth.NewTokenManager("x", time.Hour)
	h := &router.Handlers{ /* router_smoke_test.go と同じ nil 組み立て */ }
	engine := router.Setup(h, tm, &database.DB{}, []string{"http://localhost:5173"})

	out := make([]string, 0, 128)
	for _, r := range engine.Routes() {
		out = append(out, r.Method+" "+r.Path)
	}
	sort.Strings(out)
	return out
}
```

**これがこの設計の肝です。** エンドポイント一覧を手書きの YAML で持つと、Go に新ルートが増えたときに黙って検証対象から漏れます。ルータから引くことで、**新しいルートは必ずカタログに現れ、シナリオ未定義なら網羅ゲートで落ちる**。

---

## 8. ファイル構成

```
/Users/takuma.kawano/HealthFamily/backend/parity/
├── README.md                    使い方・差分が出たときの読み方
├── run.sh                       オーケストレーション（これ 1 本で全部走る）
├── doc.go                       //go:build parity  パッケージ説明
│
├── catalog/
│   └── catalog.go               gin engine.Routes() からルート表を生成
│
├── internal/
│   ├── client.go                HTTP クライアント（両実装へ同一リクエスト）
│   ├── token.go                 HS256 自前署名
│   ├── normalize.go             正規化パイプライン（ID / 時刻 / 数値 / ポリシー上書き）
│   ├── diff.go                  正規化済み JSON の再帰差分
│   ├── db.go                    TRUNCATE / シード投入 / テーブルダンプ
│   ├── runner.go                シナリオ再生エンジン（ロックステップ）
│   └── report.go                Markdown + JSON レポート出力
│
├── scenarios/
│   ├── scenario.go              Scenario / Step / Policy の型定義
│   ├── seed.sql                 全シナリオ共通の決定的シード
│   ├── members.go               メンバー系シナリオ
│   ├── medications.go
│   ├── schedules.go
│   ├── records.go
│   ├── expenses.go
│   ├── budget.go
│   ├── prescriptions.go
│   ├── crud_generic.go          MemberScopedCRUD 系 8 リソースを表駆動でまとめて生成
│   ├── errors.go                401 / 404 / 400 / 405 / 429 の異常系
│   └── all.go                   All() で全シナリオを返す
│
├── pending.go                   未移植ルートの明示リスト（切替ゲートの本体）
├── authmap.go                   認証エンドポイントの手動対応表
├── coverage_test.go             網羅ゲート
├── parity_test.go               エントリポイント
└── report/                      出力先（.gitignore）
    ├── report.md
    └── raw/{go,java}/<scenario>/<step>.json
```

### 型定義

```go
// parity/scenarios/scenario.go
type Scenario struct {
	Name  string
	Mode  Mode   // ModeRead / ModeWrite
	Seed  string // 追加シード SQL（任意）
	Steps []Step
}

type Step struct {
	Name    string
	Route   string            // "POST /api/members" — カタログ上のルート。網羅判定に使う
	Method  string
	Path    string            // "/api/members/{{memberId}}"
	Query   map[string]string
	Body    string            // "{{var}}" 展開可
	As      string            // "owner" / "other" / "" (無認証)
	Capture map[string]string // "memberId" -> "$.data.id"
	Norm    map[string]Policy // JSONPath -> 正規化ポリシー上書き
	Fatal   bool              // 差分が出たらシナリオ打ち切り（既定 true）
}
```

### 汎用 CRUD の表駆動生成

`routes_ext.go` の `MemberScopedCRUD` は 8 リソース（appointment / health-log / vaccination / examination / insurance / allergy / body-measurement / emergency-contact）で**完全に同形**です。106 本を手書きせずに済みます。

```go
// parity/scenarios/crud_generic.go
var memberScoped = []crudSpec{
	{Base: "/api/appointments",     Create: `{"memberId":"{{memberId}}","hospitalName":"○○内科","scheduledAt":"2026-09-01T10:00:00+09:00"}`,
	                                Update: `{"notes":"変更"}`},
	{Base: "/api/health-logs",      Create: `{"memberId":"{{memberId}}","recordedAt":"2026-08-16","condition":"good"}`,
	                                Update: `{"condition":"bad"}`},
	// ... 8 リソース
}

func crudScenarios() []Scenario {
	out := make([]Scenario, 0, len(memberScoped))
	for _, s := range memberScoped {
		out = append(out, Scenario{
			Name: "crud" + s.Base, Mode: ModeWrite,
			Steps: []Step{
				{Name: "作成",   Route: "POST " + s.Base,             Method: "POST",   Path: s.Base, Body: s.Create, As: "owner",
				 Capture: map[string]string{"id": "$.data.id"}},
				{Name: "一覧",   Route: "GET " + s.Base,              Method: "GET",    Path: s.Base, As: "owner"},
				{Name: "取得",   Route: "GET " + s.Base + "/:id",     Method: "GET",    Path: s.Base + "/{{id}}", As: "owner"},
				{Name: "他人",   Route: "GET " + s.Base + "/:id",     Method: "GET",    Path: s.Base + "/{{id}}", As: "other"},
				{Name: "更新",   Route: "PATCH " + s.Base + "/:id",   Method: "PATCH",  Path: s.Base + "/{{id}}", Body: s.Update, As: "owner"},
				{Name: "削除",   Route: "DELETE " + s.Base + "/:id",  Method: "DELETE", Path: s.Base + "/{{id}}", As: "owner"},
				{Name: "削除後", Route: "GET " + s.Base + "/:id",     Method: "GET",    Path: s.Base + "/{{id}}", As: "owner"},
				{Name: "無認証", Route: "GET " + s.Base,              Method: "GET",    Path: s.Base, As: ""},
			},
		})
	}
	return out
}
```

これで 8 リソース × 8 ステップ = 64 ステップが 20 行程度で書けます。残りは個別に書く。

### 網羅ゲート（切替前ゲートの本体）

```go
// parity/coverage_test.go
//go:build parity

func TestCatalogCoverage(t *testing.T) {
	covered := map[string]bool{}
	for _, sc := range scenarios.All() {
		for _, st := range sc.Steps {
			covered[st.Route] = true
		}
	}

	for _, route := range catalog.Routes() {
		if route == "GET /health" || strings.HasPrefix(route, "POST /api/auth/") {
			continue // 認証系は authmap.go の手動対応表で扱う
		}
		if covered[route] {
			continue
		}
		if reason, ok := Pending[route]; ok {
			t.Logf("未移植 (シナリオ免除): %s — %s", route, reason)
			continue
		}
		t.Errorf("ルート %s がどのシナリオからも叩かれていない。scenarios/ に追加するか pending.go に登録すること", route)
	}

	// 切替直前チェック: 未移植が残っていたら落とす
	if os.Getenv("PARITY_CUTOVER") == "1" && len(Pending) > 0 {
		t.Errorf("切替不可: 未移植ルートが %d 件残っている", len(Pending))
	}
}
```

`pending.go` は Java 移植が進むにつれて縮み、**空になったときが切替可能なとき**。これが「ゲート」の具体的な形です。

```go
// parity/pending.go
var Pending = map[string]string{
	"GET /api/users/me":            "未移植: UserProfileController が無い",
	"PATCH /api/users/me":          "未移植",
	"GET /api/expenses":            "未移植: 支出系コントローラ一式",
	"PATCH /api/members/:memberId": "未移植: MemberController に更新が無い",
	// ...
}
```

**重要**: Java は未実装ルートに対して **404 ではなく 500** を返します（実測済み。`DomainExceptionHandler` の `@ExceptionHandler(Exception.class)` が `NoResourceFoundException` を飲み込む）。したがって**未移植は自動判別できず、明示リストが必須**です。

### オーケストレーション

```bash
#!/usr/bin/env bash
# /Users/takuma.kawano/HealthFamily/backend/parity/run.sh
set -euo pipefail

ROOT=/Users/takuma.kawano/HealthFamily
export PARITY_JWT_SECRET="${PARITY_JWT_SECRET:-parity-secret-0123456789abcdefghij}"  # 32バイト以上必須
: "${JAVA_HOME:=/opt/homebrew/opt/openjdk@25/libexec/openjdk.jdk/Contents/Home}"; export JAVA_HOME

GO_PID=""; JAVA_PID=""
cleanup() { [ -n "$GO_PID" ] && kill "$GO_PID" 2>/dev/null || true
            [ -n "$JAVA_PID" ] && kill "$JAVA_PID" 2>/dev/null || true; }
trap cleanup EXIT

echo "== 1. DB 起動 =="
cd "$ROOT/backend-java" && docker compose up -d
until docker compose exec -T postgres pg_isready -U healthfamily -d healthfamily >/dev/null 2>&1; do sleep 1; done

echo "== 2. DB クローン =="
PSQL=(docker compose exec -T postgres psql -U healthfamily -d postgres -v ON_ERROR_STOP=1)
"${PSQL[@]}" -c 'DROP DATABASE IF EXISTS healthfamily_go;'
"${PSQL[@]}" -c 'DROP DATABASE IF EXISTS healthfamily_java;'
"${PSQL[@]}" -c 'CREATE DATABASE healthfamily_go   TEMPLATE healthfamily;'
"${PSQL[@]}" -c 'CREATE DATABASE healthfamily_java TEMPLATE healthfamily;'

echo "== 3. ビルド (Java は DB 起動後でないと jOOQ codegen が失敗する) =="
cd "$ROOT/backend"      && go build -o /tmp/hf-parity-go ./cmd/server
cd "$ROOT/backend-java" && ./mvnw -q package -DskipTests

echo "== 4. 起動 =="
TZ=Asia/Tokyo GIN_MODE=release PORT=18080 RATE_LIMIT_MAX=100000 \
  DATABASE_URL="postgres://healthfamily:healthfamily@localhost:55432/healthfamily_go?sslmode=disable" \
  JWT_SECRET="$PARITY_JWT_SECRET" \
  /tmp/hf-parity-go > /tmp/parity-go.log 2>&1 & GO_PID=$!

TZ=Asia/Tokyo SERVER_PORT=18081 \
  DATABASE_JDBC_URL="jdbc:postgresql://localhost:55432/healthfamily_java" \
  DATABASE_USER=healthfamily DATABASE_PASSWORD=healthfamily \
  JWT_SECRET="$PARITY_JWT_SECRET" \
  GOOGLE_CLIENT_ID=dummy.apps.googleusercontent.com GOOGLE_CLIENT_SECRET=dummy \
  "$JAVA_HOME/bin/java" -Duser.timezone=Asia/Tokyo \
  -jar "$ROOT/backend-java/target/healthfamily-api-0.0.1-SNAPSHOT.jar" > /tmp/parity-java.log 2>&1 & JAVA_PID=$!

for i in $(seq 60); do curl -sf http://localhost:18080/health >/dev/null 2>&1 && break; sleep 1; done
for i in $(seq 60); do curl -sf http://localhost:18081/actuator/health >/dev/null 2>&1 && break; sleep 1; done

echo "== 5. 差分検証 =="
cd "$ROOT/backend"
PARITY_GO_URL=http://localhost:18080 \
PARITY_JAVA_URL=http://localhost:18081 \
PARITY_DB_HOST=localhost PARITY_DB_PORT=55432 \
go test -tags parity ./parity/... -v -count=1 "$@"
```

---

## 9. ハーネスを作れば即座に出る差分（実測で既に確認済み）

作る前から検出可能と分かっているもの。**最初のレポートに必ず載ります**ので、既知として整理しておくと立ち上げが速くなります。

| # | エンドポイント | Go | Java | 種別 |
|---|---|---|---|---|
| 1 | `GET/POST /api/members` | `userId` / `createdAt` / `updatedAt` を返す | **返さない** | フィールド欠落 |
| 2 | `GET/POST /api/members` | `age` なし | **`age` を返す** | フィールド追加 |
| 3 | `GET/POST /api/members` | `birthDate: "1960-04-01T09:00:00+09:00"` | `birthDate: "1960-04-01"` | 型・形式差 |
| 4 | 全認証必須ルート（401 時） | `{"success":false,"error":"認証エラー"}` | **本文空** + `WWW-Authenticate` ヘッダ | エラー契約差 |
| 5 | 存在しないパス | 404 + **プレーンテキスト** `404 page not found` | **500** + `{"success":false,"error":"サーバーエラーが発生しました"}` | ステータス差 |
| 6 | 未実装メソッド（例 `DELETE /api/members/:id`） | 404 JSON | **500** | ステータス差 |
| 7 | ヘルスチェック | `GET /health` | `GET /actuator/health`（`/health` は 401） | パス差 |
| 8 | `PUT /api/prescriptions/:id/items` | 処方箋オブジェクトを返す | `{"success":true}`（`data` キーごと無い） | 応答本体差 |
| 9 | `POST /api/prescriptions/:id/dispense` | 作成された薬の配列 | `{createdCount, medicationIds}` | 応答本体差 |
| 10 | レート制限 | 120/min per user, 認証系は IP 単位 | **無し** | 挙動欠落 |

### 先に潰しておくべきもの

**#5 / #6（Java の 500）は最優先で直すべきです。** これを直さないと、「未実装だから 500」と「実装したが壊れて 500」が区別できず、ハーネスのシグナルが常に濁ります。`DomainExceptionHandler` に以下を足すだけです。

```java
@ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
public ResponseEntity<ApiResponse<Void>> notFoundRoute() {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("見つかりません"));
}

@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
public ResponseEntity<ApiResponse<Void>> methodNotAllowed() {
    return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(ApiResponse.failure("許可されていないメソッドです"));
}
```

（`@ExceptionHandler(Exception.class)` の catch-all がこれらを飲んでいるのが原因です。ついでに、これは移行と無関係に本番でも「404 が 500 になる」バグなので、Java 切替時にそのまま持ち込まれます。）

**#4** は `AuthenticationEntryPoint` をカスタムして Go と同じ JSON を返させる必要があります。フロントが 401 の本文を読んでいるなら破壊的です。

---

## 10. CI への載せ方

```yaml
# .github/workflows/parity.yml
name: backend parity
on:
  pull_request:
    paths: ['backend/**', 'backend-java/**']

jobs:
  parity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.26' }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '25', cache: maven }
      - run: ./backend/parity/run.sh
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: parity-report
          path: backend/parity/report/
```

`docker compose` は GitHub Actions の ubuntu ランナーに同梱されているので、compose.yaml をそのまま使えます。

**運用の段取り:**
1. 導入直後は既知差分（§9）を `known_diffs.go` に登録して**グリーンから始める**。赤いまま放置されるゲートは誰も見なくなります。
2. Java にエンドポイントを移植 → `pending.go` から 1 行消す → ハーネスが差分を出す → 直す → `known_diffs.go` からも消す。
3. `pending.go` と `known_diffs.go` の両方が空になった時点で `PARITY_CUTOVER=1` が通る。**それが切替の定義。**

---

## 11. 実装の推奨順序

1. `run.sh` + 両サーバ起動 + ヘルスチェックまで（**§0 で実証済みなので確実に動く**）
2. `catalog/` — ルート表 106 件を吐かせる
3. `pending.go` — Java 未実装を全部書き出す（現状 90 件超になるはず）
4. `internal/token.go` + `internal/client.go` + 最小の diff — **`GET /api/members` 1 本だけ**通す。ここで §9 の #1〜#3 が出れば土台が正しいことの証明になる
5. `internal/normalize.go` — ID と時刻の正規化
6. `internal/db.go` — リセット・シード・ダンプ
7. `scenarios/crud_generic.go` — 表駆動で 8 リソース一気に
8. 個別シナリオを埋める
9. `coverage_test.go` でゲート化
10. CI へ

ステップ 4 まで（半日程度）で「差分が実際に見える」状態になり、以降の投資判断ができます。

---

## 参照ファイル

- Go ルータ: `/Users/takuma.kawano/HealthFamily/backend/internal/interface/router/router.go`, `/Users/takuma.kawano/HealthFamily/backend/internal/interface/router/routes_ext.go`
- Go ルート列挙の下敷き: `/Users/takuma.kawano/HealthFamily/backend/internal/interface/router/router_smoke_test.go`
- Go レート制限（要 env 化）: `/Users/takuma.kawano/HealthFamily/backend/internal/interface/middleware/ratelimit.go`
- Go 設定（`RateLimitMax` 追加先）: `/Users/takuma.kawano/HealthFamily/backend/internal/config/config.go`
- Go 応答契約: `/Users/takuma.kawano/HealthFamily/backend/internal/pkg/response/response.go`
- Java 応答契約: `/Users/takuma.kawano/HealthFamily/backend-java/src/main/java/app/healthfamily/apiController/ApiResponse.java`
- Java 例外→HTTP（**404/405 ハンドラ追加が必要**）: `/Users/takuma.kawano/HealthFamily/backend-java/src/main/java/app/healthfamily/apiController/DomainExceptionHandler.java`
- Java 認可設定（401 本文のカスタマイズ先）: `/Users/takuma.kawano/HealthFamily/backend-java/src/main/java/app/healthfamily/config/SecurityConfig.java`
- JWT: `/Users/takuma.kawano/HealthFamily/backend/internal/pkg/auth/jwt.go` / `/Users/takuma.kawano/HealthFamily/backend-java/src/main/java/app/healthfamily/infrastructure/auth/HmacAccessTokenIssuer.java`
- 既存 IT のシード手法（`TRUNCATE` + 直 INSERT）が参考になる: `/Users/takuma.kawano/HealthFamily/backend-java/src/test/java/app/healthfamily/apiController/member/MemberControllerIT.java`