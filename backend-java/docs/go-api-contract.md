# Go 版 API 契約（Java 移植の元仕様）

Go 実装から抽出した契約。Java へ移すときの元にする。
推測ではなく handler / usecase / repository / SQL から確認した内容のみを載せている。

対象: 11 リソース群 / 120 エンドポイント

## 全体に共通する契約

- レスポンスは `{ success, data?, error? }`。成功 200、作成 201
- エラー対応: NotFound→404 / Conflict→409 / Validation→400 / Forbidden→403 / その他→500
- 認証は `Authorization: Bearer <JWT>`。欠落・不正はすべて 401「認証エラー」
- **userId は必ず JWT クレームから取る。ボディの userId は一切見ない**
- レート制限は認証済み全体で 120回/分/ユーザー、超過は 429
- 所有者不一致は 404 ではなく **403**（存在は漏れる仕様）

## appointment-hospital (Hospital / Appointment)

### 移植時の注意

【全体構造】ルート登録は router.go ではなく routes_ext.go:20-34（router.go:118 の RegisterExtraRoutes 経由）。認証必須グループ `api.Group("")` に middleware.Auth(JWT) + middleware.RateLimit("api", 120, 1分, PerUser) が適用され、10 本すべて認証必須。エラー→HTTP は pkg/response/response.go の HandleDomainError で NotFound→404 / Conflict→409 / Validation→400 / Forbidden→403 / それ以外→500「サーバーエラーが発生しました」。Appointment/Hospital のコードパス上 ConflictError と ValidationError は一度も生成されないので、実質 409 と（ドメイン由来の）400 は発生しない。

【Java 側に移すべきドメイン規則（単なる CRUD と区別）】
1. Appointment 作成時のメンバー所有権チェック（ensureMemberOwner）。userId は必ず JWT から。
2. Appointment 作成時の既定値: reminderEnabled=true, reminderDaysBefore=1。Go は DB DEFAULT に頼らずアプリ層（AppointmentRepository.Create）で明示設定しているので、Java でも明示設定が安全。
3. 所有者不一致は 404 ではなく 403 を返す（存在は漏れる仕様）。日本語メッセージ文字列も契約の一部: 「病院が見つかりません」「この病院にアクセスする権限がありません」「通院予定が見つかりません」「この通院予定にアクセスする権限がありません」「メンバーが見つかりません」「このメンバーにアクセスする権限がありません」。
4. 一覧のソート順（Hospital: createdAt DESC / Appointment: appointmentDate DESC）。
5. PATCH は「送られたキーのみ更新」。memberId・userId・createdAt は不変。
6. DELETE の戻りは 200 + data:{ok:true}（204 ではない）。フロントが data.ok を見ている可能性あり。
これ以外（Hospital の CRUD 本体、Appointment の Get/List/Delete）は所有権チェック付きの素の CRUD で、ドメインロジックは無い。HospitalUsecase.Create に至っては検証ゼロでリポジトリに素通し。

【Go 側の不具合・危うい実装（移植時に直すか、意図的に踏襲するか判断が必要）】
A. hospitalId の所有権チェック漏れ（重大）: POST/PATCH /api/appointments の hospitalId は存在確認も所有権確認も一切していない（appointment_handler.go:70,105 → crud.go の MemberScopedCRUD は memberId しか見ない）。他人の Hospital の id を推測・入手できれば自分の Appointment に他人の病院を紐付けられる（クロステナントの参照生成）。FK は "Hospital"("id") 全体を参照するだけで userId を含まない。Java 側では hospitalId 指定時に「その病院が同一 userId 所有か」を検証すべき。
B. A の副作用として、他人の Appointment が自分の Hospital を参照していると、自分の DELETE /api/hospitals/{id} が FK 違反で 500 になる（自分では原因を解消できない DoS 的状態）。
C. Hospital 削除時の FK 挙動: migrations/0001_init.sql:118 の `"hospitalId" TEXT REFERENCES "Hospital"("id")` は ON DELETE 未指定＝NO ACTION。参照中の病院を削除すると PostgreSQL の FK 違反がそのまま default 分岐に落ちて 500「サーバーエラーが発生しました」になる。本来は 409（Conflict）を返すか、hospitalId を SET NULL するのが正しい。Java 側では明示的にハンドリングすること。
D. 存在しない hospitalId を POST /api/appointments に渡すと FK 違反で 500。本来 400/404 相当。
E. PATCH /api/appointments の appointmentDate パース失敗が黙殺される（appointment_handler.go:107、parseDate が nil を返すと「更新しない」と区別できない）。"あああ" を送っても 200 が返り日付は変わらない。POST は同じ入力で 400。Java では PATCH でも 400 にすべき。
F. nullable フィールドを NULL に戻せない: Update 系はすべて `if in.X != nil` 判定で、JSON の明示 null とキー省略を区別していない（hospital_repository.go:85-106, appointment_repository.go:98-122）。一度入れた notes/cost/hospitalId をクリアする API 経路が存在しない。Java で JsonNullable などを使う場合は挙動が変わる点に注意。
G. Hospital の name バリデーション非対称: POST は `binding:"required,max=200"` だが PATCH の Name には binding タグが無い（hospital_handler.go:41 vs 75）。PATCH 経由なら 200 文字超も空文字も通る。DB 側にも長さ制約は無い（TEXT NOT NULL のみ）。
H. トランザクション不在 + プール分離: database/db.go で pgxpool（読み）と GORM（書き）の別プールを張り、GORM は `SkipDefaultTransaction: true`。Create/Update は「GORM で書き込み → 別プールの sqlc で FindByID 再読込」という 2 接続にまたがる非トランザクショナルな read-after-write。並行削除等で FindByID が nil を返すと、Create が data:null のまま 201、Update が data:null のまま 200 を返す（nil チェックが無い: appointment_repository.go:94, hospital_repository.go:81）。Java では単一トランザクション内で完結させるべき。
I. FindByID の SQL に userId 条件が無く（queries/hospital.sql, appointment.sql の GetHospital/GetAppointment は WHERE "id" = $1 のみ）、Update/Delete の WHERE も id のみ。防御が usecase 層の 1 行比較だけに依存しており、リポジトリを直接呼ぶ経路を足すと即座に横断アクセスになる。Java では WHERE 句に userId を含める（またはリポジトリメソッド自体を userId 必須にする）ことを推奨。
J. bind エラーのメッセージが固定文言で実際の原因を表さない。例えば POST /api/appointments で cost に文字列を渡しても「メンバーIDと予定日時は必須です」が返る（appointment_handler.go:59）。
K. タイムゾーン: parseDate（handler/helpers.go）はオフセット無し形式 "2006-01-02T15:04:05" と "2006-01-02" を time.Parse でパースするため UTC 扱いになる。JST 前提のクライアントが "2026-08-20" を送ると UTC 00:00＝JST 09:00 として保存される。列型は TIMESTAMPTZ。
L. 数値の範囲検証が皆無: cost の負値、reminderDaysBefore の負値・極端な値がそのまま保存される。DB 制約も無い（cost DOUBLE PRECISION、reminderDaysBefore INTEGER NOT NULL DEFAULT 1）。
M. レート制限はプロセス内 map で、キー（"api:"+userID）が期限切れ後も削除されない（middleware/ratelimit.go の store から evict する処理が無い）。マルチインスタンスでは共有されない。
N. Appointment には対応するテストが無い（usecase/crud_test.go・router/router_smoke_test.go のいずれにも appointment/hospital の記述なし）。移植時の回帰比較に使える既存テストは無い。

【DB 列との対応（migrations/0001_init.sql:88-129）】
Hospital: id TEXT PK / userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE / name TEXT NOT NULL / hospitalType, address, phoneNumber, department, doctorName, notes は TEXT NULL / createdAt TIMESTAMPTZ NOT NULL DEFAULT now()。INDEX: Hospital_userId_idx。
Appointment: id TEXT PK / userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE / memberId TEXT NOT NULL REFERENCES Member(id) ON DELETE CASCADE / hospitalId TEXT NULL REFERENCES Hospital(id)（ON DELETE 指定なし）/ appointmentType TEXT NULL / appointmentDate TIMESTAMPTZ NOT NULL / description, testResults TEXT NULL / cost DOUBLE PRECISION NULL / reminderEnabled BOOLEAN NOT NULL DEFAULT TRUE / reminderDaysBefore INTEGER NOT NULL DEFAULT 1 / createdAt TIMESTAMPTZ NOT NULL DEFAULT now()。INDEX: Appointment_userId_idx, Appointment_memberId_idx。テーブル名・列名はダブルクオート付きのキャメルケース（Prisma 由来）なので、JPA では @Table(name="\"Appointment\"") 相当のクオート指定が必須。NOT NULL の影響として reminderEnabled / reminderDaysBefore は Java 側でも primitive（非 null）で扱ってよいが、appointmentDate も非 null なので PATCH で明示的に null 化できない点は現行仕様と一致している。

【関連ファイル（絶対パス）】
/Users/takuma.kawano/HealthFamily/backend/internal/interface/router/routes_ext.go
/Users/takuma.kawano/HealthFamily/backend/internal/interface/router/router.go
/Users/takuma.kawano/HealthFamily/backend/internal/interface/handler/hospital_handler.go
/Users/takuma.kawano/HealthFamily/backend/internal/interface/handler/appointment_handler.go
/Users/takuma.kawano/HealthFamily/backend/internal/interface/handler/helpers.go
/Users/takuma.kawano/HealthFamily/backend/internal/usecase/hospital_usecase.go
/Users/takuma.kawano/HealthFamily/backend/internal/usecase/crud.go
/Users/takuma.kawano/HealthFamily/backend/internal/usecase/ownership_ext.go
/Users/takuma.kawano/HealthFamily/backend/internal/domain/entity/entities_ext.go
/Users/takuma.kawano/HealthFamily/backend/internal/domain/repository/repository_ext.go
/Users/takuma.kawano/HealthFamily/backend/internal/domain/errors.go
/Users/takuma.kawano/HealthFamily/backend/internal/pkg/response/response.go
/Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/persistence/hospital_repository.go
/Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/persistence/appointment_repository.go
/Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/persistence/gorm_models.go
/Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/sqlc/queries/hospital.sql
/Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/sqlc/queries/appointment.sql
/Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/database/db.go
/Users/takuma.kawano/HealthFamily/backend/internal/interface/middleware/auth.go
/Users/takuma.kawano/HealthFamily/backend/internal/interface/middleware/ratelimit.go
/Users/takuma.kawano/HealthFamily/backend/migrations/0001_init.sql

### GET /api/hospitals

**レスポンス**: data: Hospital[]（0件でも null ではなく空配列 []）。Hospital = { id: string(UUID v4), userId: string, name: string, hospitalType: string|null, address: string|null, phoneNumber: string|null, department: string|null, doctorName: string|null, notes: string|null, createdAt: string(RFC3339 timestamptz) }。並び順は createdAt DESC（sqlc ListHospitals: SELECT ... FROM "Hospital" WHERE "userId"=$1 ORDER BY "createdAt" DESC）

**ステータス**: 200 成功 / 401 認証エラー（Bearer 欠落・JWT 検証失敗、body: {success:false,error:"認証エラー"}）/ 429 レート制限（authed 全体に user 単位 120req/分, error:"リクエストが多すぎます。しばらくしてから再試行してください。"）/ 500 "サーバーエラーが発生しました"

**所有権**: SQL の WHERE "userId" = <JWTのuserID> のみでスコープ。アプリ層の追加チェックなし

**ドメイン規則**: 単純な一覧取得。副作用なし。ソートは createdAt 降順（作成日時のみ、name ソートなし）

### POST /api/hospitals

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `name` | string | ○ | binding:"required,max=200"（空文字不可・200文字以内。go-playground/validator の max はルーン数）。違反時は 400 "病院名は必須です" 固定文言 |
| `hospitalType` | string|null | — | 検証なし。任意の自由文字列（enum 制約は DB にもコードにも無い） |
| `address` | string|null | — | 検証なし |
| `phoneNumber` | string|null | — | 検証なし（電話番号形式チェックは無い） |
| `department` | string|null | — | 検証なし |
| `doctorName` | string|null | — | 検証なし |
| `notes` | string|null | — | 検証なし |

**レスポンス**: data: Hospital（GET /api/hospitals と同一形状の単一オブジェクト）。INSERT 後に FindByID で再読込した値を返すため createdAt は DB の now() 実値

**ステータス**: 201 Created（response.Created）/ 400 "病院名は必須です"（ShouldBindJSON 失敗すべてがこの固定文言。型不一致・JSON 壊れも同じ）/ 401 / 429 / 500

**所有権**: userId は JWT の userID を強制設定（リクエストボディから userId は受け取らない）。他の所有権チェックは無し（Hospital は member 紐付けを持たない user スコープ資源）

**ドメイン規則**: id はアプリ側で UUID v4 生成（auth.NewID / google/uuid）。createdAt は DB DEFAULT now()。usecase.HospitalUsecase.Create は検証を一切行わず repository.Create をそのまま呼ぶ純 CRUD。実質ドメイン規則は「name 必須・200文字以内」のみ

### GET /api/hospitals/{hospitalId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `hospitalId` | string (path param) | ○ | 形式検証なし（UUID 検証もしていない。存在しなければ 404） |

**レスポンス**: data: Hospital（単一オブジェクト）

**ステータス**: 200 / 404 "病院が見つかりません"（domain.NewNotFound("病院")）/ 403 "この病院にアクセスする権限がありません"（domain.NewForbidden）/ 401 / 429 / 500

**所有権**: HospitalUsecase.ensureOwner: FindByID(id) → nil なら 404、h.UserID != JWT userID なら 403。SQL 側は WHERE "id"=$1 のみで userId 絞り込みをしない（usecase 層の比較だけが防御）

**ドメイン規則**: 参照のみ。副作用なし

### PATCH /api/hospitals/{hospitalId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `hospitalId` | string (path param) | ○ | 形式検証なし |
| `name` | string|null | — | binding タグ無し。POST にある max=200 が PATCH には無い（200文字超も通る）。空文字 "" を渡すと NOT NULL は満たすが name が空になる |
| `hospitalType` | string|null | — | 検証なし |
| `address` | string|null | — | 検証なし |
| `phoneNumber` | string|null | — | 検証なし |
| `department` | string|null | — | 検証なし |
| `doctorName` | string|null | — | 検証なし |
| `notes` | string|null | — | 検証なし |

**レスポンス**: data: Hospital（UPDATE 後に FindByID で再読込した最新値）

**ステータス**: 200 / 400 "入力内容が正しくありません"（ShouldBindJSON 失敗時のみ）/ 404 "病院が見つかりません" / 403 "この病院にアクセスする権限がありません" / 401 / 429 / 500

**所有権**: ensureOwner を先に実行 → 404/403。通過後に repository.Update(id, in)（Update 側は id のみで userId を条件に入れない）

**ドメイン規則**: 部分更新セマンティクス: ポインタが nil でないフィールドのみ map に積んで GORM Updates。JSON で null を送っても省略と区別できず「無変更」になる（＝NULL に戻す手段が無い）。全フィールド nil の場合は UPDATE 文を発行せず現在値をそのまま返す（200）。userId / createdAt は更新対象外

### DELETE /api/hospitals/{hospitalId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `hospitalId` | string (path param) | ○ | 形式検証なし |

**レスポンス**: data: { ok: true }（gin.H{"ok": true}）。削除したエンティティは返さない

**ステータス**: 200（204 ではない）/ 404 "病院が見つかりません" / 403 "この病院にアクセスする権限がありません" / 401 / 429 / 500（Appointment から参照されている病院を削除すると FK 違反で 500。notes 参照）

**所有権**: ensureOwner 実行後に repository.Delete(id)（DELETE FROM "Hospital" WHERE "id" = ?、userId 条件なし）

**ドメイン規則**: 物理削除（論理削除フラグ無し・GORM ソフトデリート列も無し）。Appointment.hospitalId の FK は ON DELETE 未指定＝NO ACTION なので、参照中の病院は削除できない（カスケードも SET NULL もしない）

### GET /api/appointments

**レスポンス**: data: Appointment[]（0件でも空配列 []）。Appointment = { id: string(UUID v4), userId: string, memberId: string, hospitalId: string|null, appointmentType: string|null, appointmentDate: string(RFC3339), description: string|null, testResults: string|null, cost: number|null (double), reminderEnabled: boolean, reminderDaysBefore: number (int, non-null), createdAt: string(RFC3339) }。並び順は appointmentDate DESC（ListAppointments: WHERE "userId"=$1 ORDER BY "appointmentDate" DESC）

**ステータス**: 200 / 401 / 429 / 500

**所有権**: SQL の WHERE "userId" = <JWTのuserID> のみ。memberId によるフィルタ・クエリパラメータは存在しない（member 別取得エンドポイントは無い）

**ドメイン規則**: 未来/過去の絞り込み、ページング、リマインダ判定などは一切なし。Hospital の JOIN も無く hospitalId は ID 文字列のみ返す（病院名は別途 /api/hospitals から解決する必要あり）

### POST /api/appointments

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required"。失敗時 400 "メンバーIDと予定日時は必須です" |
| `appointmentDate` | string | ○ | binding:"required"。handler.parseDate で RFC3339 / "2006-01-02T15:04:05" / "2006-01-02" の順に time.Parse。どれにも一致しなければ 400 "予定日時の形式が正しくありません"。オフセット無しの2形式は UTC として解釈される |
| `hospitalId` | string|null | — | 存在確認・所有権確認とも無し。DB の FK 制約のみ（notes 参照） |
| `appointmentType` | string|null | — | 検証なし（enum 制約なし） |
| `description` | string|null | — | 検証なし |
| `testResults` | string|null | — | 検証なし |
| `cost` | number|null (float64) | — | 検証なし（負値・巨大値も通る） |
| `reminderEnabled` | boolean|null | — | 検証なし。未指定(nil)なら true を適用 |
| `reminderDaysBefore` | number|null (int) | — | 検証なし（負値も可）。未指定(nil)なら 1 を適用 |

**レスポンス**: data: Appointment（GET と同一形状の単一オブジェクト）。INSERT 後 FindByID で再読込した値

**ステータス**: 201 Created / 400 "メンバーIDと予定日時は必須です"（bind 失敗）または "予定日時の形式が正しくありません"（日付パース失敗）/ 404 "メンバーが見つかりません" / 403 "このメンバーにアクセスする権限がありません" / 401 / 429 / 500（存在しない hospitalId 指定時の FK 違反もここに落ちる）

**所有権**: MemberScopedCRUD.Create → ensureMemberOwner(members, in.UserID, in.MemberID): MemberRepository.FindByID(memberId) が nil なら 404「メンバーが見つかりません」、m.UserID != JWT userID なら 403「このメンバーにアクセスする権限がありません」。userId はボディからではなく JWT から設定。hospitalId の所有権は検証しない

**ドメイン規則**: 既定値をアプリ層で再現: reminderEnabled 未指定→true、reminderDaysBefore 未指定→1（AppointmentRepository.Create 内。DB DEFAULT TRUE / 1 とも一致）。id は UUID v4 をアプリ生成。createdAt は DB DEFAULT now()。日時重複チェック・過去日拒否・メンバー×日時のユニーク制約は無い。リマインダの実送信処理は存在せずフラグ保存のみ（副作用なし）

### GET /api/appointments/{appointmentId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `appointmentId` | string (path param) | ○ | 形式検証なし |

**レスポンス**: data: Appointment（単一オブジェクト）

**ステータス**: 200 / 404 "通院予定が見つかりません" / 403 "この通院予定にアクセスする権限がありません" / 401 / 429 / 500

**所有権**: MemberScopedCRUD.ensureOwner: FindByID(id)（SQL は WHERE "id"=$1 のみ）→ nil なら 404、entity.UserID != JWT userID なら 403。メンバー所有権の再確認はしない（作成時のみ）

**ドメイン規則**: 参照のみ。副作用なし

### PATCH /api/appointments/{appointmentId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `appointmentId` | string (path param) | ○ | 形式検証なし |
| `hospitalId` | string|null | — | 存在確認・所有権確認なし |
| `appointmentType` | string|null | — | 検証なし |
| `appointmentDate` | string|null | — | parseDate で同3形式を試行。パース失敗すると nil になり 400 ではなく「無変更」として黙って無視される（POST と非対称） |
| `description` | string|null | — | 検証なし |
| `testResults` | string|null | — | 検証なし |
| `cost` | number|null (float64) | — | 検証なし |
| `reminderEnabled` | boolean|null | — | 検証なし |
| `reminderDaysBefore` | number|null (int) | — | 検証なし |

**レスポンス**: data: Appointment（UPDATE 後に FindByID で再読込した最新値）

**ステータス**: 200 / 400 "入力内容が正しくありません"（bind 失敗時のみ）/ 404 "通院予定が見つかりません" / 403 "この通院予定にアクセスする権限がありません" / 401 / 429 / 500

**所有権**: ensureOwner で 404/403 判定後に repository.Update(id, in)（WHERE "id" = ? のみ、userId 条件なし）

**ドメイン規則**: 部分更新。nil でないフィールドのみ更新（JSON null＝省略扱いで NULL 化不可）。memberId は UpdateAppointmentInput に存在せず変更不可（作成後は不変）。userId / createdAt も更新対象外。更新フィールドが1つも無ければ UPDATE を発行せず現在値を返す

### DELETE /api/appointments/{appointmentId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `appointmentId` | string (path param) | ○ | 形式検証なし |

**レスポンス**: data: { ok: true }

**ステータス**: 200（204 ではない）/ 404 "通院予定が見つかりません" / 403 "この通院予定にアクセスする権限がありません" / 401 / 429 / 500

**所有権**: ensureOwner 実行後に repository.Delete(id)（DELETE FROM "Appointment" WHERE "id" = ?、userId 条件なし）

**ドメイン規則**: 物理削除。子テーブル無し。Appointment を消しても Hospital / Member は変わらない

## auth

### 移植時の注意

【共通仕様】
- レスポンス形式: 成功 `{ success: true, data: ... }`（200 は response.Success / 201 は response.Created）、失敗 `{ success: false, error: "日本語メッセージ" }`。
- エラーマッピング (internal/pkg/response/response.go HandleDomainError): NotFoundError→404 / ConflictError→409 / ValidationError→400 / ForbiddenError→403 / それ以外→500 かつ本文は固定文言 "サーバーエラーが発生しました"（内部エラー詳細は隠蔽し c.Error() でログにのみ残す）。auth リソースでは 404・409 を返す経路は存在しない。
- `data.user` は entity.User のシリアライズ結果。json:"-" により password / verificationCode / verificationExpiry / verificationAttempts / resetCode / resetCodeExpiry / googleId は絶対に出力されない。出力されるのは id, email, displayName, characterType, characterName, emailVerified, createdAt, updatedAt の8フィールドのみ。
- JWT: HS256、TTL 7日（cmd/server/main.go の auth.NewTokenManager(cfg.JWTSecret, 7*24*time.Hour)）。クレームは uid, email, sub(=userID), iat, exp。iss/aud なし。検証時は署名方式が HMAC であることのみ追加チェック。
- レート制限は router.go の ipLimit で IP 単位・1分窓: signup 10 / verify 20 / login 20 / google 20 / resend 5 / forgot 5 / reset 5。超過時 429 "リクエストが多すぎます。しばらくしてから再試行してください。"。test-login のみ無制限。
- DB スキーマ ("User" テーブル, migrations/0001_init.sql + 0009): id TEXT PK / email TEXT NOT NULL UNIQUE / password TEXT NOT NULL / displayName TEXT NULL / characterType TEXT NOT NULL DEFAULT 'cat' / characterName TEXT NULL / emailVerified BOOLEAN NOT NULL DEFAULT FALSE / verificationCode TEXT NULL / verificationExpiry TIMESTAMPTZ NULL / verificationAttempts INTEGER NOT NULL DEFAULT 0 / resetCode TEXT NULL / resetCodeExpiry TIMESTAMPTZ NULL / createdAt,updatedAt TIMESTAMPTZ NOT NULL DEFAULT now() / googleId TEXT NULL + UNIQUE インデックス。password が NOT NULL なので Google 専用ユーザーは NULL ではなく空文字 "" が入る（Java 側で NULL を入れると制約違反になる）。
- 読み取りは sqlc（GetUserByEmail / GetUserByID / GetUserByGoogleID、いずれも単純な完全一致 SELECT、pgx.ErrNoRows を nil,nil に変換）、書き込みは GORM（Create / Updates）。

【Java 側に移すべきドメイン規則（単なる CRUD ではない）】
1. email の正規化（ToLower + TrimSpace）を検索・保存の両方で必ず行う。
2. 6桁数字コードの暗号論的乱数生成、有効期限 now+10分、使用後の即時クリア。
3. bcrypt cost=12（Next.js 版と互換）。
4. ユーザー列挙防止ポリシー: signup は認証済み重複でも 201 を返す、resend-code / forgot-password は常に 200 { ok: true }、login は「存在しない」と「パスワード違い」を同一メッセージにする。
5. Google ログインの3段階解決（googleId 一致 → 確認済みメールで既存紐付け → 新規作成）と、email_verified=false の拒否。
6. 未認証ユーザーの login は 403（400 ではない）。
7. 新規ユーザーの既定値 characterType="cat"、ID は UUIDv4。

【Go 側の不具合・危うい実装（要修正 or 移植時に是正すべき点）】
1. 【重大: 認証バイパス】POST /api/auth/verify で対象ユーザーが既に EmailVerified==true の場合、auth_usecase.go:84-87 が **コードを一切検証せずに JWT を発行して early return する**。つまりメールアドレスさえ知っていれば、任意の適当な code（例 "000000"）で他人の有効な7日間トークンを取得できる。Java へそのまま移植してはならない。正しくは「既に認証済み」を 400/409 で返すか、コード検証を必須にする。
2. 【ブルートフォース対策の欠如】verificationAttempts 列が存在し entity/SQL でも読み書きされているのに、Verify でも ResetPassword でも一度もインクリメントされず、失敗回数によるロックアウトが無い。6桁コード(100万通り)に対する防御は IP 単位・プロセスローカルのレート制限（verify 20/分、reset 5/分）のみで、分散 IP からの総当たりに耐えられない。
3. 【所有権証明なしの上書き】SignUp は「未認証の既存アカウント」に対し、メール文字列が一致するだけで password / displayName / verificationCode を上書きする。第三者が登録途中のアカウントの登録内容を書き換え・妨害できる。また displayName を省略したリクエストだと既存の displayName が NULL で潰される。
4. 【エラーの握り潰し】ResendCode (`if err != nil || u == nil || u.EmailVerified { return nil }`) と ForgotPassword (`if err != nil || u == nil { return nil }`) は FindByEmail の DB エラーまで成功扱いにする。DB 障害時にクライアントへ 200 を返し、障害が見えなくなる。
5. 【トランザクション不足】signup / resend-code / forgot-password はいずれも「DB 更新 → 外部メール送信 (Resend HTTP API)」を非アトミックに実行する。メール送信が失敗すると 500 が返る一方で DB のコードは更新済みという不整合が残る。逆に DB 更新は成功しメール送信も成功した後の処理は無いのでロールバック手段が無い。
6. 【メール送信のサイレントスキップ】mailer.send は apiKey が空だと標準出力にログを出して nil（成功）を返す。RESEND_API_KEY を設定し忘れた本番環境では、signup が 201 を返し続けるのに認証コードが誰にも届かず、原因に気づけない。
7. 【パスワードリセット後もトークンが有効】ResetPassword はパスワードを変えるだけで、既発行 JWT の失効機構（トークンバージョン、jti ブラックリスト等）が無いため、乗っ取られたセッションが最大7日間生き残る。同様に ResetPassword は EmailVerified を true にしないので、未認証ユーザーはリセットしてもログインできないまま（UX 上の詰まり）。
8. 【定数時間比較でない】検証コード比較 (`*u.VerificationCode != code`)、再設定コード比較、test-login のシークレット比較 (`c.GetHeader("X-E2E-Secret") != h.testLoginSecret`) がすべて通常の文字列比較。Java 移植時は MessageDigest.isEqual 相当を使うべき。
9. 【test-login の危険度】E2E_TEST_LOGIN_SECRET が設定されていると、そのシークレットだけで **任意のメールアドレスの既存アカウント** のトークンを取得できる（無ければ検証済みユーザーを勝手に作る）。レート制限も付いていない。本番環境変数への混入は即座に全アカウント侵害になる。
10. 【レスポンスのゼロ値タイムスタンプ】LoginWithGoogle と TestLogin の新規作成パスは、GORM の Create を別構造体 (gormUser) に対して行い、返す entity.User を読み直さないため、data.user.createdAt / updatedAt が "0001-01-01T00:00:00Z" になる。既存ユーザー経路（DB から読んだ値）とレスポンスが食い違う。Google 紐付け（既存メール）経路でも updatedAt は DB 更新前の古い値が返る。
11. 【email の大文字小文字】usecase は小文字化するが、DB の UNIQUE 制約は生の TEXT に対するもので、SELECT も完全一致。旧 Next.js 実装等で大文字混じりの email 行が既に存在すると、その行は永遠に検索にヒットせず、同一人物の重複行が作られうる。Java 側では citext もしくは lower(email) の関数インデックス/UNIQUE を検討すべき。
12. 【UserRepository.Update の全列上書き】read-modify-write で全カラムを無条件に上書きし、楽観ロックが無い。同一ユーザーへの並行リクエスト（例: resend-code と forgot-password の同時実行）で片方の更新が失われる。
13. 【レート制限の実装】middleware/ratelimit.go はプロセス内 sync.Map + map で、(a) エントリの削除処理が無く無制限にメモリが増える、(b) Cloud Run のような複数インスタンス構成ではインスタンスごとに独立するため実効上限が台数倍になる。Java 側では Redis 等の共有ストアを使うべき。
14. 【軽微】auth.NewVerificationCode で `n, _ := rand.Int(...)` とエラーを無視しており、エラー時は n が nil のまま n.Int64() で nil ポインタ参照 panic になる。また signup のパスワードに最大長制限が無く、bcrypt が 72 バイトで黙って切り捨てる。

### POST /api/auth/signup

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `email` | string | ○ | binding:"required,email" (gin validator の email 形式)。usecase 側で strings.ToLower(strings.TrimSpace(email)) に正規化される |
| `password` | string | ○ | binding:"required,min=8"。最大長チェックなし (bcrypt は 72 バイトで切り捨て) |
| `displayName` | string | null (*string) | — | binding タグなし。null/未指定可 |

**レスポンス**: 201 Created: { success: true, data: { email: string, requiresVerification: true } }  ※data.email はリクエストの生値（usecase で小文字化される前の値）をそのまま返すので、DB 上の email と大文字小文字が食い違いうる

**ステータス**: 201 成功 / 400 JSON バインド・バリデーション失敗 ("入力内容が正しくありません") / 429 レート制限 10回/分/IP ("リクエストが多すぎます。しばらくしてから再試行してください。") / 500 bcrypt 失敗・リポジトリ失敗・メール送信失敗 ("サーバーエラーが発生しました")。409 Conflict は一切返らない

**所有権**: 公開エンドポイント。所有権チェックなし。既存の未認証アカウントに対しては「メール文字列が一致するだけ」で password / displayName / verificationCode / verificationExpiry を上書きする（所有証明なし）

**ドメイン規則**: (1) email を小文字化+trim。(2) 6桁数字コードを crypto/rand で生成 (auth.NewVerificationCode)、有効期限は now()+10分。(3) bcrypt cost=12 でハッシュ (auth.HashPassword)。(4) FindByEmail の結果で分岐: 既存かつ EmailVerified=true → 何もせず nil を返す（ユーザー列挙防止のため 201 を返す）／既存かつ未認証 → password, displayName, verificationCode, verificationExpiry を上書き Update してコード再送／存在しない → 新規 User を Create。(5) 新規ユーザーの既定値: ID=UUIDv4 (auth.NewID), CharacterType="cat", EmailVerified=false。characterName/verificationAttempts/resetCode は Create 時に未指定でDB既定値(NULL / 0)。(6) 副作用: mailer.SendVerificationCode (Resend API, 件名「HealthFamily 認証コード」)。RESEND_API_KEY 未設定時は送信をスキップして nil を返す。(7) DB書き込みとメール送信はトランザクション外・非アトミック

### POST /api/auth/verify

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `email` | string | ○ | binding:"required,email"。usecase で小文字化+trim |
| `code` | string | ○ | binding:"required" のみ。桁数・数字のフォーマット検証なし |

**レスポンス**: 200 OK: { success: true, data: { token: string (JWT), user: { id: string, email: string, displayName: string|null, characterType: string, characterName: string|null, emailVerified: boolean, createdAt: RFC3339 string, updatedAt: RFC3339 string } } }  ※password / verificationCode / verificationExpiry / verificationAttempts / resetCode / resetCodeExpiry / googleId は entity.User の json:"-" により常に非出力

**ステータス**: 200 成功 / 400 バインド失敗 ("入力内容が正しくありません")・ユーザー不存在 ("認証コードが正しくありません")・コード不一致/期限切れ/コード未発行 ("認証コードが正しくないか、有効期限が切れています") ※いずれも domain.ValidationError → 400 / 429 レート制限 20回/分/IP / 500 Update 失敗・JWT 署名失敗

**所有権**: 公開エンドポイント。所有権の証明は「メールに届いた6桁コード」のみ。ただし u.EmailVerified==true の場合はコード検証を完全にスキップしてJWTを発行する（後述 notes 参照）

**ドメイン規則**: (1) FindByEmail → nil なら ValidationError。(2) すでに EmailVerified==true なら **コードを検証せずに** JWT を発行して返す（早期 return）。(3) 未認証の場合のみ VerificationCode != nil かつ VerificationExpiry != nil かつ *VerificationCode == code かつ now() が期限以前、を全て満たすか検査。コード比較は単純な文字列 == （定数時間比較でない）。(4) 成功時 EmailVerified=true, VerificationCode=nil, VerificationExpiry=nil にして Update。(5) JWT 発行: HS256, TTL 7日 (main.go の NewTokenManager(secret, 7*24h))、クレーム = {uid: userID, email, sub: userID, iat, exp}。iss/aud なし。(6) verificationAttempts 列は存在するが読み込むだけで一切インクリメントされず、失敗回数によるロックアウトは実装されていない

### POST /api/auth/login

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `email` | string | ○ | binding:"required,email"。usecase で小文字化+trim |
| `password` | string | ○ | binding:"required" のみ（min=8 は付いていない） |

**レスポンス**: 200 OK: { success: true, data: { token: string (JWT), user: { id, email, displayName: string|null, characterType, characterName: string|null, emailVerified: boolean, createdAt, updatedAt } } }

**ステータス**: 200 成功 / 400 バインド失敗、またはユーザー不存在・パスワード不一致 ("メールアドレスまたはパスワードが正しくありません"。ValidationError なので 401 ではなく 400) / 403 メール未認証 ("メールアドレスが認証されていません"。ForbiddenError) / 429 レート制限 20回/分/IP / 500 JWT 署名失敗など

**所有権**: 公開エンドポイント。email+password で本人確認

**ドメイン規則**: (1) FindByEmail（小文字化済み email で完全一致）。(2) u == nil または bcrypt.CompareHashAndPassword が失敗 → 同一メッセージの ValidationError（存在有無を区別しない）。(3) EmailVerified==false なら ForbiddenError。(4) Google 専用ユーザーは Password="" で保存されるため bcrypt 検証が必ず失敗し、パスワードログイン不可（意図された挙動）。(5) 成功時 JWT (HS256/7日) を発行。ログイン試行回数のカウント・アカウントロックは無し

### POST /api/auth/google

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `credential` | string | ○ | binding:"required"。Google Identity Services が発行した ID トークン(JWT) |

**レスポンス**: 200 OK: { success: true, data: { token: string (自前発行の JWT), user: { id, email, displayName: string|null, characterType, characterName: string|null, emailVerified: boolean, createdAt, updatedAt } } }  ※新規作成パスでは createdAt/updatedAt が Go のゼロ値 "0001-01-01T00:00:00Z" になる（notes 参照）

**ステータス**: 200 成功 / 400 バインド失敗 ("認証情報が正しくありません")・GOOGLE_CLIENT_ID 未設定で Verifier が nil ("Googleログインは現在利用できません")・ID トークン検証失敗 ("Google認証に失敗しました") / 403 Google 側で email_verified=false ("Googleアカウントのメールアドレスが確認されていません") / 429 レート制限 20回/分/IP / 500 リポジトリ失敗・JWT 署名失敗

**所有権**: 公開エンドポイント。Google の署名済み ID トークン（audience が GOOGLE_CLIENT_ID と一致すること）で本人確認。既存アカウントへの自動紐付けは claims.email_verified==true の場合のみ許可される

**ドメイン規則**: (1) uc.google == nil（GOOGLE_CLIENT_ID 未設定）なら ValidationError。(2) googleauth.Verify → google.golang.org/api/idtoken.Validate(ctx, credential, clientID) で JWKS 検証。sub または email が空なら失敗。claims = {sub, email, email_verified, name(任意)}。(3) 解決順序: FindByGoogleID(sub) で見つかればそのままログイン（Create も Update もしない）→ 見つからなければ claims.EmailVerified を必須チェック → FindByEmail(小文字化 email) で既存があれば GoogleID=sub, EmailVerified=true を設定して Update（既存アカウントへの紐付け）→ どちらも無ければ新規 Create。(4) 新規作成時: ID=UUIDv4, Password=""（空文字。NOT NULL 列なので NULL ではなく空文字が入る）, DisplayName=claims.name (無ければ nil), CharacterType="cat", EmailVerified=true, GoogleID=sub。(5) DB 制約: "googleId" は NULL 許容 TEXT + UNIQUE インデックス User_googleId_key（migrations/0009）。(6) 最後に JWT (HS256/7日) 発行

### POST /api/auth/resend-code

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `email` | string | ○ | binding:"required,email"。usecase で小文字化+trim |

**レスポンス**: 200 OK: { success: true, data: { ok: true } }

**ステータス**: 200 成功（ユーザーが存在しない場合・すでに認証済みの場合・FindByEmail が DB エラーを返した場合も 200 { ok: true }） / 400 バインド失敗 / 429 レート制限 5回/分/IP / 500 Update 失敗またはメール送信失敗

**所有権**: 公開エンドポイント。所有権チェックなし。任意のメールアドレスに対して認証コード送信をトリガーできる（未認証アカウントに限る）

**ドメイン規則**: (1) FindByEmail の結果が err != nil || u == nil || u.EmailVerified のいずれかなら **何もせず nil を返す**（ユーザー列挙防止）。DB エラーまで握り潰している点に注意。(2) 未認証ユーザーのみ、新しい6桁コードを生成し VerificationCode / VerificationExpiry(now+10分) を上書き Update。(3) mailer.SendVerificationCode を送信。(4) Update とメール送信は非アトミック

### POST /api/auth/forgot-password

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `email` | string | ○ | binding:"required,email"。usecase で小文字化+trim。ハンドラは resend-code と同じ emailRequest 構造体を共用 |

**レスポンス**: 200 OK: { success: true, data: { ok: true } }

**ステータス**: 200 成功（ユーザー不存在・DB エラー時も 200 { ok: true }） / 400 バインド失敗 / 429 レート制限 5回/分/IP / 500 Update 失敗またはメール送信失敗

**所有権**: 公開エンドポイント。所有権チェックなし

**ドメイン規則**: (1) FindByEmail が err != nil || u == nil なら何もせず nil（列挙防止・DBエラーも握り潰し）。(2) EmailVerified の状態は問わない（未認証ユーザーにも再設定コードを発行する）。Google 専用ユーザー(Password="")にも発行されるため、メール受信権があればパスワードを設定できる。(3) 6桁コードを生成して ResetCode / ResetCodeExpiry(now+10分) を上書き Update。(4) mailer.SendResetCode（件名「HealthFamily パスワード再設定」）を送信

### POST /api/auth/reset-password

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `email` | string | ○ | binding:"required,email"。usecase で小文字化+trim |
| `code` | string | ○ | binding:"required" のみ |
| `password` | string | ○ | binding:"required,min=8"（新しいパスワード） |

**レスポンス**: 200 OK: { success: true, data: { ok: true } }

**ステータス**: 200 成功 / 400 バインド失敗、またはユーザー不存在・ResetCode 未発行・コード不一致・期限切れ（すべて同一メッセージ "再設定コードが正しくないか、有効期限が切れています" の ValidationError） / 429 レート制限 5回/分/IP / 500 FindByEmail の DB エラー、bcrypt 失敗、Update 失敗

**所有権**: 公開エンドポイント。所有権の証明は「メールに届いた6桁の再設定コード」のみ

**ドメイン規則**: (1) FindByEmail の DB エラーはそのまま返す（500）。(2) u == nil || ResetCode == nil || ResetCodeExpiry == nil || *ResetCode != code || now() > 期限 のいずれかで ValidationError。コード比較は単純な文字列 ==（定数時間比較でない）。(3) 新パスワードを bcrypt cost=12 でハッシュし、Password 更新、ResetCode=nil, ResetCodeExpiry=nil にして Update（コードは1回限り）。(4) EmailVerified は変更しない（未認証ユーザーはパスワードを変えてもログイン不可のまま）。(5) 既存の JWT を無効化する仕組みは無い（トークンバージョン等が無いため、リセット後も発行済みトークンが最大7日間有効）

### POST /api/auth/test-login

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `X-E2E-Secret (HTTP ヘッダー)` | string | ○ | 環境変数 E2E_TEST_LOGIN_SECRET と単純な != 比較で完全一致すること（定数時間比較でない）。不一致なら 403 |
| `email` | string | ○ | binding:"required,email"。usecase で小文字化+trim。空文字なら ValidationError |

**レスポンス**: 200 OK: { success: true, data: { token: string (JWT), user: { id, email, displayName: string|null, characterType, characterName: string|null, emailVerified: boolean, createdAt, updatedAt } } }  ※新規作成パスでは createdAt/updatedAt がゼロ値 "0001-01-01T00:00:00Z"

**ステータス**: 200 成功 / 400 バインド失敗 ("メールアドレスが正しくありません")・email 空 / 403 テストログイン無効 or シークレット不一致 ("テストログインは無効です") / 404 E2E_TEST_LOGIN_SECRET 未設定時はそもそもルート未登録 / 500 Create・JWT 失敗。※レート制限ミドルウェアは付いていない

**所有権**: 共有シークレットのみで任意のメールアドレスのアカウントに成りすませる。ユーザー所有権チェックは一切なし。E2E_TEST_LOGIN_SECRET が空のとき router.Setup がルート自体を登録しない（AuthHandler.TestLoginEnabled() による）ので本番では無効化される想定

**ドメイン規則**: (1) ハンドラでシークレット検証（testLoginSecret == "" または X-E2E-Secret 不一致で 403）。(2) FindByEmail で既存ユーザーがあればそのまま JWT を発行（既存アカウントに成りすまし可能）。(3) 無ければ ID=UUIDv4, Password=bcrypt(ランダムUUID), DisplayName="E2E Test User", CharacterType="cat", EmailVerified=true で Create。(4) JWT (HS256/7日) を発行。Java 移植時はプロファイル/条件付き Bean 等でテスト環境限定にすること

## examination-vaccination

### 移植時の注意

## 全体構造（Java 側の設計判断に直結）

- ルート登録は /Users/takuma.kawano/HealthFamily/backend/internal/interface/router/routes_ext.go の 44-58 行。router.go で `api := r.Group("/api")` → `authed := api.Group("")` に `middleware.Auth(tm)` と `middleware.RateLimit("api", 120, 1分, PerUser)` を適用し、その group に `RegisterExtraRoutes(authed, db)` で登録している。つまり両リソースとも認証必須＋ユーザー単位 120req/min。
- examination / vaccination 専用の usecase は存在しない。両者とも `usecase.NewMemberScopedCRUD[E, C, U]`（/Users/takuma.kawano/HealthFamily/backend/internal/usecase/crud.go）というジェネリック CRUD をパラメータ違いで使い回しているだけ。appointment / health-log / insurance / allergy / body-measurement / emergency-contact も同じ器。Java 側でも共通の抽象クラスかジェネリックサービス1つに寄せられる。
- 差分パラメータは (a) 404 用リソース名（"検査" / "予防接種"）、(b) 403 メッセージ、(c) entity→ownerUserId 抽出、(d) createInput→userId / memberId 抽出の4点のみ。
- **ドメイン規則と呼べるものは実質2つだけ**: ①作成時のメンバー所有権チェック（ensureMemberOwner）②取得/更新/削除時のレコード所有権チェック（ensureOwner）。それ以外は純粋な CRUD。日付パースと必須チェック以外に計算・集計・状態遷移・通知などの副作用は一切ない。
- 読み取りは sqlc（pgxpool）、書き込みは GORM（database/sql の別プール）という二重構成（/Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/database/db.go）。GORM は `SkipDefaultTransaction: true`。Java(JPA) に移すとこの分離は自然に消えるので、下記の TOCTOU 系の危うさは移植で自動的に改善する。

## エラーマッピング（pkg/response/response.go）

`HandleDomainError` は errors.As で判定:
- NotFoundError → 404、ConflictError → 409、ValidationError → 400、ForbiddenError → 403、それ以外 → 500 + 固定文言 "サーバーエラーが発生しました"（元エラーは c.Error() でログのみ）。
- NotFound のメッセージは `domain.NewNotFound(name)` により必ず `<name>が見つかりません`。本リソースでは "検査が見つかりません" / "予防接種が見つかりません" / "メンバーが見つかりません"。
- ハンドラ内の 400 は HandleDomainError を通らず `response.Error(c, 400, 固定文言)` を直接呼ぶ。
- 本リソースの経路で 409(Conflict) と 422 は発生しない。

## 見つかった Go 側の不具合・危うい実装（Java 移植時に直すべき点）

1. **UPDATE/DELETE の SQL に userId 条件がない**（examination_repository.go:100-109, vaccination_repository.go:95-104）。`WHERE "id" = ?` だけ。所有権はアプリ層の ensureOwner に完全依存しており、しかも読み（sqlc/pgxpool）と書き（GORM プール）が別コネクション・別トランザクションなので TOCTOU が成立する。Java では `deleteByIdAndUserId` / `WHERE id = :id AND userId = :userId` のように SQL 側にも所有条件を二重に入れるべき。

2. **PATCH の日付パース失敗がサイレントに握り潰される**。handler.parseDate（interface/handler/helpers.go）はパース不能なら nil を返すだけで、Update ハンドラはそれを「未指定」として扱う。`{"examinedAt":"2026-13-45"}` を送ると 400 にならず 200 が返り、値は変わらない。POST では 400 になるので挙動が非対称。Java では PATCH でも不正日付は 400 にすべき。

3. **null でフィールドをクリアできない**。`*string` / `*time.Time` の nil が「未指定」と「明示的な null」の両方を意味してしまっている。`{"notes": null}` を送っても notes は消えず、`nextScheduledDate` に至っては空文字も parseDate で nil になるため NULL に戻す手段が API 上存在しない。Java では JsonNullable / Optional 等で「未指定」と「null 指定」を区別する必要がある。

4. **PATCH で NOT NULL 列に空文字を入れられる**。`examinationType` / `vaccineName` は POST では binding:"required" で空文字が弾かれるが、PATCH には binding タグがないため `{"vaccineName":""}` がそのまま UPDATE される。Java 側では PATCH にも @NotBlank 相当の検証を入れるべき。

5. **Create/Update 後の読み直しが別プール経由で、nil が素通りする**。両 repository の Create は GORM で INSERT した後 `r.FindByID(ctx, m.ID)`（sqlc/pgxpool）で読み直す。ここが nil を返しても handler はエラーにせず `201 {success:true, data:null}` を返してしまう。Update も同様に `200 {data:null}` になりうる。Java では保存結果をそのまま返せば済む。

6. **imageData（base64 画像）に一切の検証がない**。Examination の imageData は TEXT 列にそのまま突っ込まれ、サイズ上限・MIME 検証・リクエストボディ上限のいずれも存在しない（コード全体を grep しても MaxBytesReader 等の設定なし）。加えて `GET /api/examinations` は絞り込み・ページングなしで imageData 込みの全件を返すため、レコードが増えるとレスポンスが破綻する。Java 移植時は上限バリデーション＋一覧からの imageData 除外（または別エンドポイント化）を検討すべき。

7. **404 と 403 を区別しているため、他人のレコード ID の存在有無が漏れる**。ensureOwner は「存在しない→404」「存在するが他人→403」を返し分ける。厳密には他人のリソースも 404 に統一するのが安全。

8. **DELETE が 0 件削除でも 200 {ok:true}**。GORM の Delete は影響行数を見ておらず、RowsAffected を確認していない。ensureOwner を通っているので通常は問題ないが、競合削除時に成功を偽装する。

9. **バインドエラーの文言が実際の原因と一致しない**。`ShouldBindJSON` が型不一致・不正 JSON で失敗した場合も POST は "メンバーID・検査種別・検査日は必須です"（Examination）/ "メンバーID・ワクチン名・接種日は必須です"（Vaccination）という必須項目固定の文言を返す。移植時に文言互換を保つなら同じ挙動を再現する必要があるが、改善するならフィールド別エラーにすべき。

10. **業務的な整合性チェックが皆無**。`nextScheduledDate < examinedAt/vaccinatedAt` の逆転、極端な未来日・過去日、同一メンバー・同一ワクチン・同一日の重複登録、いずれもチェックしていない。移植で足すか、Go と同じく素通しにするかは仕様判断が必要（現状の Go 実装は素通し）。

11. **PATCH に空 body `{}` を送ると UPDATE を発行せず 200 で現在値が返る**。「何も更新されなかった」ことをクライアントが判別できない。

## 日時の扱い（移植で崩れやすい）

- 受け付ける入力レイアウトは RFC3339 / `2006-01-02T15:04:05` / `2006-01-02` の3つだけ（helpers.go:10）。タイムゾーン省略形は Go の time.Parse により **UTC** として解釈される。日付のみ（`2026-08-15`）は UTC の 00:00:00 になる。JST 前提のクライアントから日付だけ送られると 9 時間ずれる余地がある点は Go でも既にそうなっている。
- 列は TIMESTAMPTZ（migrations/0001_init.sql:131-156）。レスポンスの JSON は Go の time.Time 既定シリアライズ＝RFC3339Nano。Java(OffsetDateTime + Jackson)へ移す際は秒未満の桁数表現が変わりうるので、フロントの `new Date()` パースで問題ないか確認すること。

## テーブル定義（migrations/0001_init.sql、imageData のみ 0007）

```
"Vaccination"( id TEXT PK, userId TEXT NOT NULL FK User(id) ON DELETE CASCADE,
  memberId TEXT NOT NULL FK Member(id) ON DELETE CASCADE, vaccineName TEXT NOT NULL,
  vaccinatedAt TIMESTAMPTZ NOT NULL, nextScheduledDate TIMESTAMPTZ, notes TEXT,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT now() )
  index: (userId), (memberId)

"Examination"( id TEXT PK, userId TEXT NOT NULL FK User(id) ON DELETE CASCADE,
  memberId TEXT NOT NULL FK Member(id) ON DELETE CASCADE, examinationType TEXT NOT NULL,
  examinedAt TIMESTAMPTZ NOT NULL, nextScheduledDate TIMESTAMPTZ, notes TEXT,
  imageData TEXT, createdAt TIMESTAMPTZ NOT NULL DEFAULT now() )
  index: (userId), (memberId)
```
列名は Prisma 由来のクォート付きキャメルケース。Java(JPA) では `@Column(name = "\"examinationType\"")` 相当か、命名戦略で明示的にマッピングする必要がある（デフォルトのスネークケース変換に任せると全滅する）。id は DB 側採番ではなくアプリ側で `uuid.NewString()`（UUID v4）を生成して INSERT している点にも注意。

## 参照した主なファイル（絶対パス）

- /Users/takuma.kawano/HealthFamily/backend/internal/interface/router/routes_ext.go
- /Users/takuma.kawano/HealthFamily/backend/internal/interface/router/router.go
- /Users/takuma.kawano/HealthFamily/backend/internal/interface/handler/examination_handler.go
- /Users/takuma.kawano/HealthFamily/backend/internal/interface/handler/vaccination_handler.go
- /Users/takuma.kawano/HealthFamily/backend/internal/interface/handler/helpers.go
- /Users/takuma.kawano/HealthFamily/backend/internal/usecase/crud.go
- /Users/takuma.kawano/HealthFamily/backend/internal/usecase/ownership_ext.go
- /Users/takuma.kawano/HealthFamily/backend/internal/domain/entity/entities_ext.go (46-69行)
- /Users/takuma.kawano/HealthFamily/backend/internal/domain/repository/repository_ext.go (101-153行)
- /Users/takuma.kawano/HealthFamily/backend/internal/domain/errors.go
- /Users/takuma.kawano/HealthFamily/backend/internal/pkg/response/response.go
- /Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/persistence/examination_repository.go
- /Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/persistence/vaccination_repository.go
- /Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/persistence/gorm_models.go (298-336行)
- /Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/sqlc/sqlcgen/examination.sql.go
- /Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/sqlc/sqlcgen/vaccination.sql.go
- /Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/database/db.go
- /Users/takuma.kawano/HealthFamily/backend/internal/interface/middleware/auth.go
- /Users/takuma.kawano/HealthFamily/backend/internal/interface/middleware/ratelimit.go
- /Users/takuma.kawano/HealthFamily/backend/migrations/0001_init.sql (131-156行), 0007_add_missing_columns.sql (19-20行)
- /Users/takuma.kawano/HealthFamily/backend/internal/usecase/crud_test.go（所有権チェックの期待挙動が明文化されている。Java 側のテスト移植の元ネタになる）

### GET /api/vaccinations

**レスポンス**: data: Vaccination[] （空でも null ではなく [] を返す。repository が make([]entity.Vaccination, 0, n) で初期化しているため）

Vaccination = {
  id: string (UUID v4),
  userId: string,
  memberId: string,
  vaccineName: string,
  vaccinatedAt: string (Go time.Time の JSON = RFC3339Nano, DB は TIMESTAMPTZ),
  nextScheduledDate: string | null,
  notes: string | null,
  createdAt: string (RFC3339Nano)
}

注: updatedAt 列・フィールドは存在しない。memberName など member のネスト情報は返さない（フロントが memberId で自前結合している）。

**ステータス**: 200 成功 / 401 認証エラー(Authorization ヘッダ無し・Bearer 以外・JWT 検証失敗、body: {success:false,error:"認証エラー"}) / 429 レート制限(認証済み全 API 共通で userID 単位 120req/min、error:"リクエストが多すぎます。しばらくしてから再試行してください。") / 500 サーバーエラーが発生しました

**所有権**: WHERE "userId" = JWT の userID。ログインユーザー自身の行のみ。member 側の所有権チェックは不要（userId で絞っているため）。

**ドメイン規則**: 検証・計算・副作用なし。usecase.MemberScopedCRUD.List は repo.List(userID) をそのまま呼ぶだけ。SQL: SELECT ... FROM "Vaccination" WHERE "userId" = $1 ORDER BY "vaccinatedAt" DESC。ページング・memberId 絞り込み・期間絞り込みのクエリパラメータは一切ない（全件返す）。

### POST /api/vaccinations

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required" → 空文字・欠落は 400。加えて usecase で「そのメンバーがログインユーザーの所有か」を検証 |
| `vaccineName` | string | ○ | binding:"required" → 空文字・欠落は 400。長さ上限・文字種・マスタ照合など追加検証は一切なし |
| `vaccinatedAt` | string (日付文字列) | ○ | binding:"required" かつ handler.parseDate でパース可能なこと。許容レイアウトは RFC3339 / "2006-01-02T15:04:05" / "2006-01-02" の3種のみ。パース失敗で 400。タイムゾーン無し表記は UTC として解釈される。未来日・過去日の制限なし |
| `nextScheduledDate` | string | null | — | parseDate に通す。null・空文字・パース不能はすべて nil（=DB NULL）になり、エラーにはならない。vaccinatedAt との前後関係チェックなし |
| `notes` | string | null | — | 検証なし。長さ上限なし |

**レスポンス**: data: Vaccination（List と同一の1件オブジェクト）。id はサーバー側で uuid.NewString() 採番、userId は JWT の userID で上書き（リクエスト body の userId は受け付けない）、createdAt は DB DEFAULT now()／GORM の autoCreateTime。

**ステータス**: 201 作成成功 / 400 JSON バインド失敗(error:"メンバーID・ワクチン名・接種日は必須です" 固定文言) / 400 接種日パース失敗(error:"接種日の形式が正しくありません") / 403 メンバー非所有(error:"このメンバーにアクセスする権限がありません") / 404 メンバー不存在(error:"メンバーが見つかりません") / 401 / 429 / 500

**所有権**: usecase.MemberScopedCRUD.Create → ensureMemberOwner(members, JWT userID, req.memberId)。MemberRepository.FindByID で member を取得し、nil なら NotFound("メンバー")、member.UserID != JWT userID なら Forbidden。通過後に Vaccination.userId = JWT userID で INSERT するため、他人の member への紐付けはできない。

**ドメイン規則**: 1) 必須3項目の存在チェック（gin binding）
2) vaccinatedAt の日付パース（3レイアウト）
3) メンバー所有権チェック（下記）
4) INSERT。計算・集計・通知などの副作用は一切なし。単なる CRUD の Create。
DB NOT NULL 制約: id / userId / memberId / vaccineName / vaccinatedAt / createdAt。nextScheduledDate と notes のみ NULL 可。userId・memberId は User(id)・Member(id) への FK（ON DELETE CASCADE）。

### GET /api/vaccinations/:vaccinationId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `vaccinationId` | string (path param) | ○ | 形式検証なし（UUID かどうかも見ない）。見つからなければ 404 |

**レスポンス**: data: Vaccination（1件オブジェクト）

**ステータス**: 200 / 404 存在しない(error:"予防接種が見つかりません") / 403 他人の所有(error:"この予防接種にアクセスする権限がありません") / 401 / 429 / 500

**所有権**: ensureOwner: id で1件取得 → nil なら NotFound → entity.UserID != JWT userID なら Forbidden。SQL 自体は userId 条件を持たず、アプリ層で突き合わせている（404 と 403 が区別されるため、他人の ID の存在有無が漏れる）。

**ドメイン規則**: SELECT ... FROM "Vaccination" WHERE "id" = $1 の1件取得のみ。pgx.ErrNoRows は (nil, nil) に変換され、usecase 側で NotFound に変換される。

### PATCH /api/vaccinations/:vaccinationId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `vaccinationId` | string (path param) | ○ | — |
| `vaccineName` | string | null | — | binding タグなし。省略/null なら未更新。空文字 "" を渡すと NOT NULL 列に空文字が入る（Create では弾かれるのに Update では通る） |
| `vaccinatedAt` | string | null | — | parseDate に通す。パース不能でも 400 にならず nil 扱い＝サイレントに未更新（Create と非対称） |
| `nextScheduledDate` | string | null | — | 同上。null を送っても NULL クリアはできない（nil = 未指定として扱われる） |
| `notes` | string | null | — | null では消せない。空文字 "" を送れば実質クリアできる |

**レスポンス**: data: Vaccination（更新後に FindByID で読み直した1件）。memberId・userId は更新対象外（リクエスト構造体に存在しない）。

**ステータス**: 200 / 400 JSON バインド失敗(error:"入力内容が正しくありません"、body が空・型不一致など) / 404 / 403 / 401 / 429 / 500

**所有権**: ensureOwner（Get と同じ）を通してから UPDATE。ただし UPDATE 文の WHERE は "id" のみで userId 条件が無い。チェックと更新は別コネクション・別トランザクション。

**ドメイン規則**: 部分更新。nil でないフィールドだけを map に積み、1件でもあれば UPDATE "Vaccination" SET ... WHERE "id" = ?。積むフィールドが0件なら UPDATE を発行せず現在値をそのまま 200 で返す（{} を送ると成功扱い）。値の妥当性検証・日付の前後関係チェック・副作用なし。

### DELETE /api/vaccinations/:vaccinationId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `vaccinationId` | string (path param) | ○ | — |

**レスポンス**: data: { ok: true }（削除したエンティティは返さない）

**ステータス**: 200 / 404 / 403 / 401 / 429 / 500

**所有権**: ensureOwner 後に削除。DELETE 文の WHERE は "id" のみで userId 条件なし。0件削除でもエラーにならず 200 {ok:true} を返す。

**ドメイン規則**: 物理削除。DELETE FROM "Vaccination" WHERE "id" = ?。論理削除カラム（DeletedAt）は GORM モデルにもテーブルにも存在しない。関連レコードのカスケード処理は Vaccination 側からは発生しない（親 User/Member 削除時に CASCADE される側）。

### GET /api/examinations

**レスポンス**: data: Examination[] （空でも []）

Examination = {
  id: string (UUID v4),
  userId: string,
  memberId: string,
  examinationType: string,
  examinedAt: string (RFC3339Nano / TIMESTAMPTZ),
  nextScheduledDate: string | null,
  notes: string | null,
  imageData: string | null (base64 文字列を TEXT にそのまま格納),
  createdAt: string (RFC3339Nano)
}

注: updatedAt は存在しない。Vaccination との差分は examinationType/examinedAt という命名と imageData の有無のみ。

**ステータス**: 200 / 401 / 429 / 500

**所有権**: WHERE "userId" = JWT の userID。

**ドメイン規則**: SELECT ... FROM "Examination" WHERE "userId" = $1 ORDER BY "examinedAt" DESC。絞り込み・ページングなし。imageData（base64画像）も含めて全件返すため、レスポンスが極端に肥大しうる。

### POST /api/examinations

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required"。加えてメンバー所有権チェック |
| `examinationType` | string | ○ | binding:"required" のみ。列挙値でもマスタでもなく自由文字列。長さ上限なし |
| `examinedAt` | string (日付文字列) | ○ | binding:"required" かつ parseDate（RFC3339 / "2006-01-02T15:04:05" / "2006-01-02"）でパース可能。失敗で 400 |
| `nextScheduledDate` | string | null | — | parseDate。null/空文字/パース不能はすべて nil（DB NULL）で無エラー |
| `notes` | string | null | — | 検証なし |
| `imageData` | string | null | — | 検証が一切ない。base64 かどうか・MIME・サイズ上限・リクエストボディ上限のいずれもチェックしていない |

**レスポンス**: data: Examination。id は uuid.NewString()、userId は JWT の userID、createdAt は now()。

**ステータス**: 201 / 400 バインド失敗(error:"メンバーID・検査種別・検査日は必須です") / 400 日付不正(error:"検査日の形式が正しくありません") / 403 メンバー非所有(error:"このメンバーにアクセスする権限がありません") / 404 メンバー不存在(error:"メンバーが見つかりません") / 401 / 429 / 500

**所有権**: ensureMemberOwner(members, JWT userID, req.memberId)。member が nil → NotFound("メンバー")、member.UserID != JWT userID → Forbidden。

**ドメイン規則**: Vaccination.Create と完全に同型（必須チェック → 日付パース → メンバー所有権 → INSERT）。計算・副作用なし。
DB NOT NULL: id / userId / memberId / examinationType / examinedAt / createdAt。NULL 可: nextScheduledDate / notes / imageData（imageData は migrations/0007 で後付けされた TEXT NULL 列）。

### GET /api/examinations/:examinationId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `examinationId` | string (path param) | ○ | 形式検証なし |

**レスポンス**: data: Examination（1件）

**ステータス**: 200 / 404 存在しない(error:"検査が見つかりません") / 403 他人の所有(error:"この検査にアクセスする権限がありません") / 401 / 429 / 500

**所有権**: ensureOwner: 取得 → nil なら 404 → entity.UserID != JWT userID なら 403。SQL に userId 条件なし。

**ドメイン規則**: SELECT ... WHERE "id" = $1 の1件取得。pgx.ErrNoRows → (nil, nil) → NotFound。

### PATCH /api/examinations/:examinationId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `examinationId` | string (path param) | ○ | — |
| `examinationType` | string | null | — | binding タグなし。空文字 "" が NOT NULL 列にそのまま入る |
| `examinedAt` | string | null | — | parseDate。パース不能でも 400 にならずサイレント未更新 |
| `nextScheduledDate` | string | null | — | null では NULL に戻せない |
| `notes` | string | null | — | null では消せない。空文字なら実質クリア |
| `imageData` | string | null | — | null では消せない。空文字なら実質クリア。サイズ・形式検証なし |

**レスポンス**: data: Examination（更新後に読み直した1件）。memberId・userId は更新不可（リクエスト構造体にない）。

**ステータス**: 200 / 400 バインド失敗(error:"入力内容が正しくありません") / 404 / 403 / 401 / 429 / 500

**所有権**: ensureOwner 後に UPDATE。UPDATE の WHERE は "id" のみ（userId 条件なし）。チェックは sqlc/pgx プール、更新は GORM プールで別トランザクション。

**ドメイン規則**: nil でないフィールドのみ map に積んで UPDATE。0件なら UPDATE を発行せず現在値を 200 で返す。値検証・日付整合性チェック・副作用なし。

### DELETE /api/examinations/:examinationId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `examinationId` | string (path param) | ○ | — |

**レスポンス**: data: { ok: true }

**ステータス**: 200 / 404 / 403 / 401 / 429 / 500

**所有権**: ensureOwner 後に削除。DELETE の WHERE は "id" のみ。

**ドメイン規則**: 物理削除。DELETE FROM "Examination" WHERE "id" = ?。論理削除なし。0件削除でも 200。

## expense-budget

### 移植時の注意

【共通の前提】
- ルート定義は router.go の 100-110 行目のみ。routes_ext.go には expense/budget のルートは無い（grep で確認済み）。全て `api.Group("")` + `middleware.Auth(tm)` + `middleware.RateLimit("api", 120, time.Minute, middleware.PerUser)` 配下。
- 認証は `Authorization: Bearer <JWT>` 必須。欠落/不正は 401 `{"success":false,"error":"認証エラー"}`。レート制限超過は 429 `{"success":false,"error":"リクエストが多すぎます。しばらくしてから再試行してください。"}`。
- エラーのステータス変換は pkg/response/response.go の HandleDomainError: NotFoundError→404 / ConflictError→409 / ValidationError→400 / ForbiddenError→403 / それ以外→500 `"サーバーエラーが発生しました"`（元エラーは c.Error に積むだけで body には出さない）。expense/budget では ConflictError は一度も使われていない。
- DB 列: Expense(id TEXT PK, userId TEXT NOT NULL FK→User ON DELETE CASCADE, memberId TEXT NULL FK→Member ON DELETE SET NULL, category TEXT NOT NULL, amount INTEGER NOT NULL, description TEXT NULL, expenseDate TIMESTAMPTZ NOT NULL, isDeductible BOOLEAN NOT NULL DEFAULT TRUE, createdAt TIMESTAMPTZ NOT NULL DEFAULT now())。Budget(userId に UNIQUE、monthlyAmount INTEGER NOT NULL DEFAULT 0、alertEnabled BOOLEAN NOT NULL DEFAULT TRUE、lastAlertedMonth TEXT NULL)。CategoryBudget(UNIQUE(userId, category)、monthlyAmount INTEGER NOT NULL DEFAULT 0)。Expense に updatedAt 列は無い。
- 実装の分担: 読み取りは sqlc(FindByID/Get) と 生SQL/pgx(List/Summary)、書き込みは GORM。Java では JPA/MyBatis のどちらでも良いが、Summary の FILTER 句付き集計と `AT TIME ZONE 'Asia/Tokyo'` はネイティブクエリで移すのが確実。

【Go 側の不具合・危うい実装（Java 移植時に直すか、意図的に維持するか判断が必要）】
1. PATCH /api/expenses/:id で expenseDate の形式が不正でも 400 にならない。ハンドラが `parseDate(req.ExpenseDate)` の nil をそのまま UpdateExpenseInput に渡し、usecase は nil を「未変更」と解釈するため、日付が更新されないまま 200 が返る。POST は同じ nil を 400 にしているので挙動が非対称。Java 側は PATCH でも形式エラーを 400 にすべき。
2. memberId に空文字 "" を渡すと 500 になる。ExpenseUsecase.ensureMemberOwner は `*memberID == ""` を「メンバー紐付けなし」として所有権チェックをスキップするが、リポジトリはその "" をそのまま INSERT/UPDATE する。memberId は Member(id) への FK なので FK 違反 → ドメインエラーではないため 500。POST・PATCH 双方に該当。Java 側では空文字を NULL に正規化すべき。
3. memberId / description を NULL に戻す経路が存在しない。PATCH はポインタ nil を「未変更」に使っているため、JSON の `null` と「キー未指定」を区別できない。既に紐付けたメンバーを外すことも、説明を消すこともできない。Java 移植時に JsonNullable 等で区別するか、仕様として明記する必要がある。
4. POST /api/expenses/import にトランザクションが無い。ImportMany は 1 件ずつ `expenses.Create` を呼び、途中の DB エラーでその場で return するため、それまでの INSERT は残ったまま 500 が返る（部分適用）。再送すると重複登録される（冪等キー無し）。Java では一括 INSERT を 1 トランザクションにまとめるべき。
5. import に件数上限が無い。巨大な配列を送ると N 回の INSERT に加え、行ごとに Member を SELECT する N+1 が発生する（同じ memberId でもキャッシュしない）。上限（例: 1000 件）を入れるべき。
6. import は他人の memberId を指定した行も 403 にせず単に skipped に計上する。情報漏洩はしないが、クライアントは「日付不正」「金額不正」「権限なし」を区別できない。エラー行の詳細を返す設計に改めるのが望ましい。
7. BudgetUsecase.CheckAlert の emailSent が実態と一致しない。メール送信は `_ = uc.mail.SendBudgetAlert(...)` と戻り値を捨てる best-effort で、さらに `if u, e := uc.users.FindByID(...); e == nil && u != nil` の外側で MarkAlerted を呼んでいる。つまりユーザーが見つからず一通も送っていなくても、送信が失敗しても、MarkAlerted が成功すれば emailSent: true を返す。
8. 逆に、メール送信成功後に MarkAlerted が失敗すると lastAlertedMonth が更新されないため、次回呼び出しで同月に再送される（重複送信）。メール送信と lastAlertedMonth の更新が同一トランザクションでなく、外部 I/O と DB 更新の整合が取れていない。
9. BudgetRepository.MarkAlerted は Budget 行が存在しなくても UPDATE 0 件で nil を返す（サイレント no-op）。現状は Budget 未設定なら monthlyAmount=0 で overBudget が必ず false になるため到達しないが、判定条件を変えると即座に「毎回メール送信」になる潜在バグ。
10. PUT /api/budget で categories を省略すると既存のカテゴリ別予算が全消去される。BudgetRepository.Set はカテゴリを常に「全削除 → 再作成」するため、`{"monthlyAmount": 30000}` だけを送ったつもりが全カテゴリ予算を消す。PATCH セマンティクスを期待するクライアントには破壊的。
11. PUT /api/budget で categories に同じ category を重複させると UNIQUE("userId","category") 違反になるが、生の DB エラーなので 409 ではなく 500 になる。Java 側では事前重複チェック → 400/409 にすべき。
12. Budget の category 文字列が一切検証されていない。支出側の許可リスト（medication/hospital/pharmacy/insurance/checkup/pet/transport/other）と照合しないため、存在しないカテゴリ名の予算を保存でき、CheckAlert では perCat が永久に 0 のまま一致せず、無効な予算が UI に残り続ける。
13. カテゴリ予算 0 を保存できない。Set は `if c.MonthlyAmount <= 0 { continue }` で黙って捨てるため、リクエストで送った categories とレスポンスの categories が一致しないことがある（明示的に 0 を設定して「予算ゼロ」を表現できない）。
14. CheckAlert が当年の支出を全件メモリに読み込んでから Go 側で当月分をフィルタしている（`expenses.List(ctx, userID, ExpenseFilter{Year: year})`）。SQL で月を絞っていないため、支出件数に比例してメモリ・転送量が増える。Java では月範囲を SQL で絞り、SUM/GROUP BY で集計すべき。
15. タイムゾーンの不整合。GET /api/expenses/summary の既定年は `time.Now().Year()`（サーバーのローカルTZ。Dockerfile / config / main.go に TZ 設定は見当たらず UTC の可能性が高い）だが、集計 SQL と BudgetUsecase は `Asia/Tokyo` 固定。JST の 1/1 00:00〜09:00 の間、既定年が前年になりうる。Java 側は既定年も ZoneId.of("Asia/Tokyo") に統一すべき。
16. parseDate はタイムゾーン非対応の書式（"2006-01-02", "2006-01-02T15:04:05"）を UTC として解釈する。日付のみ（UTC 00:00 → JST 09:00）なら同日に収まるので集計上のズレは起きないが、オフセット付き RFC3339 や JST ローカル日時をそのまま送ると年/月の帰属が JST 変換でずれる（例: "2025-12-31T20:00:00-05:00" は JST では 2026-01-01 扱い）。
17. amount の上限チェックが無い。Go 側は int（64bit）で受けるが DB の amount は INTEGER（int32）。2147483647 を超える値はバリデーションを通過して DB エラー → 500 になる。Java では Integer + 上限バリデーションを入れる。
18. ExpenseRepository の Update / Delete の WHERE が `"id"` のみで userId をスコープに含めていない。現状は usecase の ensureOwner が先に確認するため実害は無いが、多層防御としては WHERE に userId を含め、影響行数 0 なら 404 にするのが安全（ensureOwner と UPDATE の間の TOCTOU も塞げる）。
19. バリデーションエラーのメッセージが実態とずれる。POST /api/expenses で amount に文字列を渡すとバインド失敗となり「カテゴリと支出日は必須です」が返る。フロント互換を優先するなら文言を維持する必要があるが、Bean Validation でフィールド別メッセージにする方が正しい。
20. GET /api/budget が未設定時に返す既定オブジェクトは entity.Budget のゼロ値をそのまま JSON 化するので、`id: ""` と `createdAt/updatedAt: "0001-01-01T00:00:00Z"` という不自然な値が入る。Java の Instant/LocalDateTime では同じ値を再現できないため、null にするかフロント側の扱いを確認する必要がある。
21. 医療費控除の試算は意図的な簡易実装。(a) regularDeduction は「所得200万円未満なら所得の5%」ルールを無視して足切り 10 万円固定（コード内コメントで所得不明のためと明記）。(b) selfMedicationDeduction は category=="pharmacy" の合計をそのまま OTC 購入額とみなしており、isDeductible フラグを見ない（isDeductible=false の pharmacy 支出も算入される）。この 2 点は「単なる CRUD」ではなくドメイン規則なので、そのまま移すか直すかを明示的に判断すべき。
22. POST /api/budget/alert は判定 API に見えて lastAlertedMonth を更新する副作用があり、冪等ではない。またサーバー側の定期実行（cron 等）は無く、クライアントが叩かないと通知されない。Java 移植時にスケジューラ化するなら、月1回制御を lastAlertedMonth 依存のままにするか要検討。
23. ExpenseUsecase.Summary の `year <= 0 → 400` はハンドラが v>0 のときしか渡さないためデッドコード。移植時に落としてよい。
24. GET /api/expenses の year クエリが数値でない場合は 400 にせず黙って無視される（型エラーを握り潰す）。Java の @RequestParam Integer では自動で 400 になるため、既存フロントの挙動が変わらないか確認が必要。

【単なる CRUD として扱ってよい部分】
- Expense の List / FindByID / Create / Update / Delete 自体（列マッピングと userId スコープのみ）。
- Budget の Get（upsert 済み行の読み出し）と CategoryBudget の読み出し。
これら以外の「カテゴリ許可リスト」「金額 >= 1」「予算 >= 0」「医療費控除の2制度試算」「JST 基準の年月集計」「予算超過判定（> 判定・0は未設定扱い）」「月1回のアラート抑止」「カテゴリ予算の完全置き換え」はドメイン規則として Java 側に移す必要がある。

### GET /api/expenses

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId (query)` | string | — | 空文字なら未指定扱い（世帯全体＝全件）。指定時は Member を FindByID し、存在しなければ 404、Member.userId != 認証ユーザー なら 403 |
| `year (query)` | int (文字列で受け strconv.Atoi) | — | Atoi 失敗時はエラーにせず黙って無視（フィルタなし）。リポジトリは f.Year > 0 のときのみ `EXTRACT(YEAR FROM "expenseDate" AT TIME ZONE 'Asia/Tokyo') = $n` を付与 |

**レスポンス**: data = Expense[]（0件でも null ではなく []）。Expense = { id: string, userId: string, memberId: string|null, category: string, amount: number(円/整数), description: string|null, expenseDate: string(RFC3339), isDeductible: boolean, createdAt: string(RFC3339) }。並び順は `ORDER BY "expenseDate" DESC`（同値時の第2キー無し＝不安定）

**ステータス**: 200 成功 / 400 なし / 401 認証エラー(Bearer 無し・JWT 不正, error:"認証エラー") / 403 他人のメンバー指定("このメンバーにアクセスする権限がありません") / 404 メンバー不存在("メンバーが見つかりません") / 429 レート制限 / 500 その他

**所有権**: SQL の WHERE に必ず "userId"=認証ユーザー が入る。memberId 指定時は追加で ExpenseUsecase.ensureMemberOwner により Member の所有者一致を検証

**ドメイン規則**: 年フィルタは Asia/Tokyo 基準。memberId が NULL の（世帯全体）支出だけを絞り込む手段は存在しない。副作用なし（純粋な読み取り）

### GET /api/expenses/summary

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `year (query)` | int | — | 未指定/Atoi失敗/v<=0 の場合は `time.Now().Year()`（サーバーのローカルTZ。JST 固定ではない）を既定値にする |

**レスポンス**: data = ExpenseSummary = { year: number, total: number, deductibleTotal: number, byCategory: { [category: string]: number }（データ無しなら {}）, byMonth: [{ month: number(1-12), total: number }]（該当月のみ。0埋めなし、月昇順、データ無しなら []）, regularDeduction: number, selfMedicationDeduction: number, recommendedScheme: "regular" | "selfmed" | "none" }

**ステータス**: 200 成功 / 401 認証エラー / 429 レート制限 / 500 その他（usecase に year<=0 → 400 "集計対象の年を指定してください" があるがハンドラが v>0 のときしか渡さないため到達不能）

**所有権**: 3本の集計 SQL すべてが WHERE "userId"=$1 でスコープ。メンバー単位の絞り込みは無く、必ずユーザー全体の合計

**ドメイン規則**: 【Java へ移すべきドメイン規則】(1) 集計は全て `EXTRACT(... FROM "expenseDate" AT TIME ZONE 'Asia/Tokyo')` の JST 基準。(2) total = SUM(amount)、deductibleTotal = SUM(amount) FILTER (WHERE "isDeductible")。(3) regularDeduction = max(0, deductibleTotal - 100000)（足切り10万円固定）。(4) selfMedicationDeduction = min(88000, max(0, byCategory["pharmacy"] - 12000))（足切り12000・上限88000）。(5) recommendedScheme は 両方0→"none"、regularDeduction >= selfMedicationDeduction →"regular"、それ以外→"selfmed"。計算はリポジトリではなく usecase 側（集計SQLの結果に後付け）

### POST /api/expenses

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string|null | — | binding タグ無し。null/未指定/空文字は「世帯全体の支出」として所有権チェックをスキップ。値ありなら Member 存在＋所有者一致（404/403） |
| `category` | string | ○ | binding:"required"。さらに usecase で許可リスト照合: medication / hospital / pharmacy / insurance / checkup / pet / transport / other のみ。それ以外は 400 "カテゴリの指定が正しくありません" |
| `amount` | int | — | binding タグ無し（未指定なら 0）。usecase で amount <= 0 は 400 "金額は1円以上で入力してください"。上限チェック無し（DB は INTEGER=int32） |
| `description` | string|null | — | 検証なし。長さ制限なし |
| `expenseDate` | string | ○ | binding:"required"。parseDate が RFC3339 → "2006-01-02T15:04:05" → "2006-01-02" の順で試行。全て失敗なら 400 "支出日の形式が正しくありません"。TZ 無し書式は UTC として解釈される |
| `isDeductible` | bool|null | — | 未指定/null なら既定 true（ハンドラで補完） |

**レスポンス**: data = 作成された Expense（INSERT 後に FindByID で読み直した完全な行）。GET /api/expenses の要素と同じ形

**ステータス**: 201 作成 / 400 JSON バインド失敗("カテゴリと支出日は必須です") / 400 日付形式不正("支出日の形式が正しくありません") / 400 金額不正("金額は1円以上で入力してください") / 400 カテゴリ不正("カテゴリの指定が正しくありません") / 400 支出日ゼロ値("支出日は必須です", ハンドラで弾かれるため実質到達不能) / 403 他人のメンバー / 404 メンバー不存在 / 401 / 429 / 500

**所有権**: userId は必ず JWT から取得（リクエストボディからは受け取らない）。memberId 指定時のみ ensureMemberOwner で Member.userId == 認証ユーザー を検証

**ドメイン規則**: 検証順序が固定: amount → category → expenseDate ゼロ値 → メンバー所有権 → INSERT。id は auth.NewID() で採番、createdAt は DB の DEFAULT now()。単一 INSERT のためトランザクション無しで問題なし

### POST /api/expenses/import

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `expenses` | array of { memberId?: string|null, category: string, amount: int, description?: string|null, expenseDate: string, isDeductible?: bool|null } | ○ | binding:"required"（空配列 [] も required 違反で 400）。件数上限なし。各行の category/amount/expenseDate に binding タグは無く、行単位で「不正ならスキップ」方式 |

**レスポンス**: data = { imported: number, skipped: number }（どの行がスキップされたかの情報は返さない）

**ステータス**: 201 作成 / 400 JSON バインド失敗・expenses 未指定・空配列("取込データが正しくありません") / 401 / 429 / 500（途中の DB エラー。それまでの登録はロールバックされない）

**所有権**: 全行の userId を JWT のユーザーで上書き。memberId は行ごとに ensureMemberOwner を通すが、他人のメンバーでも 403 にはせず skipped に計上する

**ドメイン規則**: スキップ条件（この順で判定）: (1) ハンドラで parseDate 失敗 → skip、(2) usecase で amount <= 0 || category が許可リスト外 || expenseDate ゼロ値 → skip、(3) ensureMemberOwner がエラー（DB エラー含む）→ skip。isDeductible 未指定は行ごとに true 補完。DB エラー（Create 失敗）だけは skip せず即 return し、それまでの imported/skipped と共に 500 を返す

### PATCH /api/expenses/:expenseId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `expenseId (path)` | string | ○ | 存在しなければ 404 "支出が見つかりません"、他人のものなら 403 |
| `memberId` | string|null (ポインタ) | — | nil（キー未指定）＝未変更。値ありなら ensureMemberOwner を通す。ただし空文字 "" は所有権チェックをスキップし、そのまま UPDATE される |
| `category` | string|null (ポインタ) | — | nil＝未変更。値ありなら許可リスト照合 → 不正なら 400 |
| `amount` | int|null (ポインタ) | — | nil＝未変更。値ありで <= 0 なら 400 |
| `description` | string|null (ポインタ) | — | nil＝未変更。検証なし。NULL に戻す手段が無い |
| `expenseDate` | string|null (ポインタ) | — | nil/空文字＝未変更。parseDate に失敗しても nil が返るだけでエラーにならず「未変更」として 200 が返る（POST と非対称） |
| `isDeductible` | bool|null (ポインタ) | — | nil＝未変更 |

**レスポンス**: data = 更新後の Expense（UPDATE 後に FindByID で読み直し）。変更フィールドが 0 件の場合は UPDATE を発行せず現在の行をそのまま返す

**ステータス**: 200 成功 / 400 JSON バインド失敗("入力内容が正しくありません") / 400 金額不正 / 400 カテゴリ不正 / 403 支出が他人のもの("この支出にアクセスする権限がありません") / 403 memberId が他人のメンバー / 404 支出不存在("支出が見つかりません") / 404 メンバー不存在 / 401 / 429 / 500

**所有権**: ensureOwner で Expense.userId == 認証ユーザー を先に検証。ただし実際の UPDATE の WHERE は "id" のみで userId をスコープに含めない（TOCTOU 的に非原子）

**ドメイン規則**: 部分更新（nil = 未変更）。検証順序: 所有権 → amount → category → メンバー所有権 → UPDATE。updatedAt 列は Expense テーブルに存在しない

### DELETE /api/expenses/:expenseId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `expenseId (path)` | string | ○ | 存在しなければ 404、他人のものなら 403 |

**レスポンス**: data = { ok: true }

**ステータス**: 200 成功 / 403 他人の支出("この支出にアクセスする権限がありません") / 404 支出不存在("支出が見つかりません") / 401 / 429 / 500

**所有権**: ensureOwner で Expense.userId == 認証ユーザー を検証してから物理削除。DELETE の WHERE は "id" のみで userId 条件なし

**ドメイン規則**: 論理削除ではなく物理削除。関連レコードのカスケードは無し（Expense は末端テーブル）

### GET /api/budget

**レスポンス**: data = Budget = { id: string, userId: string, monthlyAmount: number, alertEnabled: boolean, lastAlertedMonth: string|null ("YYYY-MM"), categories: [{ category: string, monthlyAmount: number }]（category 昇順、0件なら []）, createdAt: string(RFC3339), updatedAt: string(RFC3339) }

**ステータス**: 200 成功 / 401 / 429 / 500

**所有権**: Budget / CategoryBudget とも WHERE "userId" = 認証ユーザー。Budget は userId に UNIQUE 制約があり 1ユーザー1行

**ドメイン規則**: 【重要】未設定（DB に行が無い）場合でも 404 にせず既定オブジェクトを返す: monthlyAmount=0, alertEnabled=true, categories=[]。ただし Go の entity ゼロ値をそのまま JSON 化するため id は ""、createdAt/updatedAt は "0001-01-01T00:00:00Z" になる。monthlyAmount=0 は「未設定」扱い（アラート判定の対象外）

### PUT /api/budget

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `monthlyAmount` | int | — | binding タグ無し（未指定なら 0＝未設定扱いで保存される）。usecase で < 0 なら 400 "予算は0円以上で入力してください"。上限なし |
| `alertEnabled` | bool|null | — | 未指定/null なら既定 true（ハンドラで補完） |
| `categories` | array of { category: string, monthlyAmount: int } | — | binding タグ無し。各 monthlyAmount < 0 なら 400 "カテゴリ予算は0円以上で入力してください"。category 文字列は一切検証しない（支出の許可カテゴリと照合しない） |

**レスポンス**: data = Budget（保存後に Get で読み直した完全な行。id / createdAt / updatedAt は DB 値、categories は DB から category 昇順で再取得）

**ステータス**: 200 成功（201 ではない） / 400 JSON バインド失敗("入力内容が正しくありません") / 400 予算が負("予算は0円以上で入力してください") / 400 カテゴリ予算が負("カテゴリ予算は0円以上で入力してください") / 401 / 429 / 500（categories に同一 category が重複していると UNIQUE("userId","category") 違反で 409 ではなく 500）

**所有権**: userId は JWT のみ。Budget は ON CONFLICT ("userId") の upsert、CategoryBudget は WHERE "userId" = 認証ユーザー で全削除 → 再作成

**ドメイン規則**: 【Java へ移すべきドメイン規則】(1) 全体が GORM の Transaction で囲まれている（upsert + カテゴリ全削除 + 再作成は原子的）。(2) Budget は userId 単位の upsert で更新列は monthlyAmount / alertEnabled / updatedAt=now() のみ（id・createdAt・lastAlertedMonth は保持）。(3) categories は「差分更新」ではなく完全置き換え（送った内容が全て）。(4) monthlyAmount <= 0 のカテゴリはリポジトリ層で黙って捨てられ保存されない

### POST /api/budget/alert

**レスポンス**: data = BudgetAlertStatus = { overBudget: boolean, monthTotal: number, monthlyAmount: number, overCategories: string[]（0件でも []）, emailSent: boolean }

**ステータス**: 200 成功 / 401 / 429 / 500（Budget 取得・支出一覧取得の DB エラーのみ。メール送信失敗は 500 にしない）

**所有権**: Budget / Expense / User すべて認証ユーザーの userId でスコープ。他人のデータには触れない

**ドメイン規則**: 【Java へ移すべきドメイン規則】(1) 現在時刻は Asia/Tokyo (UTC+9) 固定に変換して年・月を決める。(2) 当年の支出を List(Year=year) で取得し、Go 側で `expenseDate.In(JST).Month() == 当月` の行だけを合計（monthTotal）＋カテゴリ別に集計。(3) overCategories = 予算の各カテゴリのうち MonthlyAmount > 0 かつ 当月実績 > 予算 のもの。(4) overTotal = Budget.monthlyAmount > 0 かつ monthTotal > monthlyAmount。判定は「>」であり「>=」ではない（同額ぴったりは超過扱いにしない）。0 は未設定扱いで常に非超過。(5) overBudget = overTotal || len(overCategories) > 0。(6) 通知は overBudget かつ alertEnabled かつ lastAlertedMonth != "YYYY-MM"（当月）のときだけ、メール送信 → Budget.lastAlertedMonth = 当月 を更新（月1回限り）。(7) emailSent は lastAlertedMonth の更新に成功したかどうかで決まる（メール送信の成否ではない）。副作用: メール送信 + lastAlertedMonth 更新

## healthlog-temperature-body

### 移植時の注意

【確認に使ったファイル】
- ルート登録: /Users/takuma.kawano/HealthFamily/backend/internal/interface/router/router.go (L67-119), routes_ext.go (L37-42 HealthLog, L77-82 BodyMeasurement, L85-91 TemperatureRecord)
- handler: internal/interface/handler/health_log_handler.go, body_measurement_handler.go, temperature_record_handler.go, helpers.go (parseDate)
- usecase: internal/usecase/crud.go (MemberScopedCRUD), temperature_record_usecase.go, ownership_ext.go (ensureMemberOwner)
- repository: internal/infrastructure/persistence/{health_log,body_measurement,temperature_record}_repository.go, gorm_models.go (L157-167, L213-223, L272-283)
- SQL: internal/infrastructure/sqlc/queries/{health_log,body_measurement,temperature_record}.sql
- DDL: migrations/0001_init.sql (L102-112, L186-210), 0008_add_missing_column_defaults.sql (HealthLog.symptoms DEFAULT '{}')
- 共通: internal/pkg/response/response.go, internal/domain/errors.go, internal/interface/middleware/{auth,ratelimit}.go, internal/infrastructure/database/db.go

【共通の契約】
- レスポンス: 成功 {success:true, data:...}、エラー {success:false, error:"日本語メッセージ"}。エラー時に data キーは出ない。
- ドメイン例外 → HTTP: NotFoundError→404 / ConflictError→409 / ValidationError→400 / ForbiddenError→403 / それ以外→500 "サーバーエラーが発生しました"。この3リソースは Conflict / Validation ドメイン例外を一度も生成していない（400 は全て handler の bind/parse 段階）。
- 認証: Authorization: Bearer <JWT>。middleware.Auth が claims.UserID を context に格納。userId は必ず JWT 由来でリクエスト body からは受け取らない。
- レート制限: 全認証エンドポイントに RateLimit("api", 120, 1分, PerUser)。超過で 429。
- HealthLog は createdAt 列が存在しない（Body/Temperature にはある）。Java の Entity で createdAt を足すと契約が変わるので注意。
- List 系は必ず配列を返す（make([]T, 0, n)）。null にならない。Java 側も空配列を返すこと。
- 3リソースとも同じ DB 制約: userId/memberId は TEXT NOT NULL + User/Member への FK ON DELETE CASCADE。メンバー削除で記録も消える。

【移植で Java 側に必ず移すべきドメイン規則（これだけ）】
1. Create 時: memberId が呼び出しユーザー所有のメンバーであること（未存在→404「メンバーが見つかりません」、他人所有→403「このメンバーにアクセスする権限がありません」）
2. Get/Update/Delete 時: レコードの userId == 認証ユーザー（未存在→404「<リソース名>が見つかりません」、他人→403「この<リソース名>にアクセスする権限がありません」）
3. GET /temperature-records/member/:memberId 時: メンバーの所有権のみ確認
4. HealthLog.symptoms の nil → [] 正規化（TEXT[] NOT NULL 制約対応）
5. recordedAt / measuredAt の日付パース許容形式 3種（RFC3339, yyyy-MM-dd'T'HH:mm:ss, yyyy-MM-dd）
それ以外は完全に素の CRUD。計算・状態遷移・通知・他リソースへの波及は一切ない。

【Go 側の不具合・危うい実装（Java 移植時に直すべき／意図的に踏襲するか判断が要る）】
(A) 【重要】PATCH で NULL にクリアできない: notes / weight / height / conditionLevel はすべてポインタで `if in.X != nil` 判定のため、JSON の null は「未指定」と区別されず無視される。フロント側 frontend/src/pages/health-logs/model/health-logs.ts の UpdateBodyMeasurementInput は `weight?: number|null; height?: number|null; notes?: string|null` と「null でクリアする」型定義になっており、フロントの意図とバックエンドの実装が食い違っている。Java では JsonNullable / Optional<Optional<T>> 等で三値（未指定／null／値）を区別すべき。

(B) 【重要】不正な日付文字列が黙って捨てられる: PATCH の recordedAt / measuredAt は parseDate が nil を返しても 400 にならず「未指定」扱いで無視され、200 が返る。ユーザーには更新成功に見えるのに更新されていない。さらに POST /health-logs は Create でも nil チェックが無く、不正な日付文字列を送ると黙って DB の now() が入る（POST /temperature-records と POST /body-measurements は Create 時に 400 を返すので、3リソースで挙動が非対称）。

(C) 【重要】値域検証がサーバ側に一切ない:
  - conditionLevel: 0 / -1 / 999999 がそのまま保存される（実測で 200 を確認。フロントは 1..5 前提で CONDITION_LABELS[level] を引くので undefined になる）
  - temperature: 0 / -100 / 1000 も保存可能（実測確認）
  - weight / height: 負値可、両方 null のレコードも作成可能
  - symptoms: フロントは 18 種の enum を想定するがサーバは任意文字列を許す
  DB 側にも CHECK 制約が無い。Java 移植時に Bean Validation で入れるべきだが、既存データに範囲外の値が入っている可能性があるので読み出し側を壊さないこと。

(D) ListTemperatureRecordsByMember の SQL に userId 条件が無い: `WHERE "memberId" = $1` のみ。現状は usecase の ensureMemberOwner が防いでいるので漏洩しないが、多重防御が無い。将来メンバー共有機能を入れたりデータ不整合（同一 member に別 userId のレコード）が起きると他人のデータを返す。Java では `WHERE memberId = ? AND userId = ?` にすべき。同様に Get/Update/Delete の SQL もすべて `WHERE id = ?` のみで userId 条件が無く、アプリ層の比較だけが境界になっている。

(E) TOCTOU / トランザクション欠如: ensureMemberOwner（SELECT）→ INSERT、ensureOwner（SELECT）→ UPDATE/DELETE がいずれも別クエリ・別トランザクション。しかも database.DB は「読み = pgxpool(sqlc)」「書き = GORM(database/sql)」の別プール構成で、gorm.Config に SkipDefaultTransaction: true が設定されており単発書き込みにトランザクションが張られない。所有権チェックと書き込みが原子的でない。Java では @Transactional + `UPDATE ... WHERE id = ? AND userId = ?` の更新件数チェックにするのが安全。

(F) 書き込み直後の読み直しがクロスプール: Create/Update は GORM で書いた直後に sqlc(別プール・別コネクション)の FindByID で読み直す。同一 primary への読みなので実害は出にくいが、リードレプリカやコネクションプーラを挟むと read-your-write が壊れる。

(G) 書き込み直後の FindByID が nil でもエラーにならない: Create は `return r.FindByID(ctx, m.ID)` をそのまま返すため、読み直しで見つからないと (nil, nil) になり handler が 201 + `data: null` を返す。Update/Delete 直前に他セッションが削除した場合も PATCH が 200 + `data: null` を返す。Java では 404 か 500 を返すべき。

(H) 情報漏洩（軽微）: 存在しない ID は 404、存在するが他人の ID は 403 と返り分けるため、ID の存在有無が判別できる。ID は UUID v4 なので実害は小さいが、Java 側で 404 に統一する選択肢はある。

(I) エンドポイントの非対称性: `/member/:memberId` 形式の一覧は temperature-records にしか無い。health-logs / body-measurements にメンバー別一覧が必要ならフロントが全件取得してクライアント側で絞っている（frontend/src/pages/health-logs/model/health-logs.ts）。移植時にどちらへ揃えるか要判断。

(J) 400 のエラーメッセージが実態と合わない: POST /health-logs はどんなバインド失敗でも "メンバーIDと体調レベルは必須です" を返すため、型不一致（例: conditionLevel に文字列）や空 body でも同じメッセージになりデバッグしにくい。

(K) レート制限がプロセス内メモリ（sync.Map）: Cloud Run の複数インスタンス構成ではインスタンスごとにカウントされ、実効上限が インスタンス数 × 120/分 になる。エントリの期限切れ削除も無くメモリが単調増加する。

(L) List 系にページング・件数上限が無い: WHERE userId のみで全件返す。体温記録は日次で増えるので長期利用でレスポンスが肥大する。

### GET /api/health-logs

**レスポンス**: data: HealthLog[] (配列。0件でも null ではなく [])。HealthLog = { id: string(UUIDv4), userId: string, memberId: string, conditionLevel: number(int32), symptoms: string[](NOT NULL、空なら []), notes: string|null, recordedAt: string(RFC3339 timestamptz) }。※HealthLog だけ createdAt 列が存在せずレスポンスにも無い

**ステータス**: 200 成功 / 401 Authorization: Bearer 無し・JWT 検証失敗 (error="認証エラー") / 429 レート制限超過 (error="リクエストが多すぎます。しばらくしてから再試行してください。") / 500 DB エラー (error="サーバーエラーが発生しました")

**所有権**: WHERE userId = JWT の userID。usecase 層では追加チェック無し（SQL の userId 条件のみが所有権境界）

**ドメイン規則**: SQL: SELECT id, memberId, userId, conditionLevel, symptoms, notes, recordedAt FROM "HealthLog" WHERE "userId" = $1 ORDER BY "recordedAt" DESC。ページング・フィルタ・memberId 絞り込みは一切無し。単なる CRUD の List

### POST /api/health-logs

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required" — 未指定/null/空文字はすべて 400。値域検証なし。存在チェックは usecase の ensureMemberOwner が実施 |
| `conditionLevel` | *int (integer) | ○ | binding:"required" — キー欠落 or null なら 400。ポインタなので 0 や -1 は通る（実測確認済み）。範囲検証は Go 側に一切なし（フロントは 1..5 を想定） |
| `symptoms` | string[] | — | 検証なし。省略/null → Go では nil → repository が []string{} に正規化（symptoms 列は TEXT[] NOT NULL DEFAULT '{}'）。[] を送ると非 nil の空配列。要素の enum 検証はサーバ側に無い（フロントは headache/fever/... 18種を想定） |
| `notes` | *string | — | 検証なし。長さ制限なし（DB は TEXT） |
| `recordedAt` | *string | — | handler の parseDate で RFC3339 → "2006-01-02T15:04:05" → "2006-01-02" の順に試行。いずれも失敗すると nil を返し、エラーにならず「未指定」と同じ扱いになる。未指定/パース失敗時は DB の DEFAULT now()（GORM の default:now() タグでカラム省略） |

**レスポンス**: data: HealthLog（Create 後に FindByID で読み直した値。{ id, userId, memberId, conditionLevel, symptoms, notes, recordedAt }）

**ステータス**: 201 成功 / 400 バインド失敗 (error="メンバーIDと体調レベルは必須です"。空 body・memberId 空文字・conditionLevel 欠落/null・型不一致すべてこの1メッセージ) / 403 メンバーが他人の所有 (error="このメンバーにアクセスする権限がありません") / 404 memberId が存在しない (error="メンバーが見つかりません") / 401 / 429 / 500

**所有権**: usecase.MemberScopedCRUD.Create → ensureMemberOwner: MemberRepository.FindByID(memberId) を引き、nil なら NotFound("メンバー")、member.UserID != JWT userID なら Forbidden。通過後に INSERT（所有権確認と INSERT は同一トランザクションではない）

**ドメイン規則**: ドメイン規則は「memberId が呼び出しユーザーの所有メンバーであること」のみ。id はサーバ側で UUID v4 生成 (auth.NewID)。userId は JWT から強制設定（body からは受け取らない）。symptoms の nil → [] 正規化は NOT NULL 制約対応。conditionLevel/notes/recordedAt に業務検証・計算・副作用なし

### GET /api/health-logs/:logId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `logId` | string (path param) | ○ | 形式検証なし。DB の id 列は TEXT なので UUID 以外でも 404 になるだけ |

**レスポンス**: data: HealthLog（単体オブジェクト）

**ステータス**: 200 / 404 該当なし (error="体調ログが見つかりません") / 403 他人のログ (error="この体調ログにアクセスする権限がありません") / 401 / 429 / 500

**所有権**: usecase.MemberScopedCRUD.ensureOwner: FindByID(id) が nil → NotFound、entity.UserID != JWT userID → Forbidden。存在するが他人のものだと 403 が返るため「その ID が存在すること」が漏れる

**ドメイン規則**: SELECT ... FROM "HealthLog" WHERE "id" = $1（userId 条件なしで取得 → アプリ層で所有者比較）。単なる CRUD の Get

### PATCH /api/health-logs/:logId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `logId` | string (path param) | ○ | なし |
| `conditionLevel` | *int | — | binding タグなし。省略/null なら未更新。値域検証なし（0・負値・巨大値も通る） |
| `symptoms` | string[] | — | 省略 or null → nil → 未更新。[] → 空配列で上書き（クリア可能）。要素の enum 検証なし |
| `notes` | *string | — | 省略 or null → 未更新。"" を送れば空文字で上書き。NULL に戻す手段が無い |
| `recordedAt` | *string | — | parseDate。パース失敗しても 400 にならず「未指定」と同じ扱いで黙って無視される |

**レスポンス**: data: HealthLog（更新後に FindByID で読み直した値）。更新対象フィールドが1つも無い場合は UPDATE を発行せず現在値をそのまま返す

**ステータス**: 200 / 400 body が JSON でない・空 body (error="入力内容が正しくありません") / 404 (error="体調ログが見つかりません") / 403 (error="この体調ログにアクセスする権限がありません") / 401 / 429 / 500。※空オブジェクト {} は 400 ではなく 200

**所有権**: ensureOwner で所有者確認 → その後 UPDATE。UPDATE 側の WHERE は id のみ（userId 条件なし）。確認と更新が別クエリ・別トランザクション

**ドメイン規則**: 部分更新（nil でないフィールドのみ map に積んで GORM Updates）。UPDATE "HealthLog" SET <指定列> WHERE "id" = ?。memberId・userId は更新不可（Update input に存在しない）。検証・計算・副作用なし

### DELETE /api/health-logs/:logId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `logId` | string (path param) | ○ | なし |

**レスポンス**: data: { ok: true }（固定オブジェクト。削除されたエンティティは返さない）

**ステータス**: 200 / 404 (error="体調ログが見つかりません") / 403 (error="この体調ログにアクセスする権限がありません") / 401 / 429 / 500

**所有権**: ensureOwner 通過後に DELETE。DELETE の WHERE は id のみ

**ドメイン規則**: 物理削除（DELETE FROM "HealthLog" WHERE "id" = ?）。論理削除カラム無し。カスケード対象の子テーブル無し

### GET /api/temperature-records

**レスポンス**: data: TemperatureRecord[]（0件でも []）。TemperatureRecord = { id: string(UUIDv4), userId: string, memberId: string, temperature: number(double), measuredAt: string(RFC3339), notes: string|null, createdAt: string(RFC3339) }

**ステータス**: 200 / 401 / 429 / 500

**所有権**: WHERE userId = JWT userID

**ドメイン規則**: SELECT ... FROM "TemperatureRecord" WHERE "userId" = $1 ORDER BY "measuredAt" DESC。ページング無し

### GET /api/temperature-records/member/:memberId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string (path param) | ○ | なし |

**レスポンス**: data: TemperatureRecord[]（0件でも []）

**ステータス**: 200 / 404 memberId が存在しない (error="メンバーが見つかりません") / 403 他人のメンバー (error="このメンバーにアクセスする権限がありません") / 401 / 429 / 500

**所有権**: usecase.ListByMember → ensureMemberOwner(memberId) でメンバーの所有者のみ確認。レコード自身の userId は照合しない（SQL も memberId のみ）

**ドメイン規則**: SELECT ... FROM "TemperatureRecord" WHERE "memberId" = $1 ORDER BY "measuredAt" DESC。※SQL 側に userId 条件が無い。この形の member 別一覧は temperature-records のみ存在し、health-logs / body-measurements には対応エンドポイントが無い（非対称）。インデックス TemperatureRecord_memberId_measuredAt_idx あり

### POST /api/temperature-records

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required" — 未指定/空文字は 400 |
| `temperature` | *float64 | ○ | binding:"required" — キー欠落/null は 400。ポインタなので 0 や -100、1000 も通る（実測確認済み）。上下限検証は Go 側に無く、DB の CHECK 制約も無い |
| `measuredAt` | string | ○ | binding:"required"（空文字は 400）。さらに parseDate が nil を返すと 400 "測定日時の形式が正しくありません"。許容形式は RFC3339 / "2006-01-02T15:04:05" / "2006-01-02"。タイムゾーン無し形式は UTC 扱いで parse される |
| `notes` | *string | — | 検証なし |

**レスポンス**: data: TemperatureRecord（Create 後に FindByID した値）

**ステータス**: 201 / 400 バインド失敗 (error="メンバーID・体温・測定日時は必須です") / 400 日付形式不正 (error="測定日時の形式が正しくありません") / 403 (error="このメンバーにアクセスする権限がありません") / 404 (error="メンバーが見つかりません") / 401 / 429 / 500

**所有権**: TemperatureRecordUsecase.Create → ensureMemberOwner(in.UserID, in.MemberID)。member が nil → 404、member.UserID != userID → 403。通過後に INSERT（別トランザクション）

**ドメイン規則**: ドメイン規則は memberId の所有権確認のみ。id は UUID v4 をサーバ生成。userId は JWT から。temperature 列は DOUBLE PRECISION NOT NULL、measuredAt は TIMESTAMPTZ NOT NULL（DEFAULT 無し・GORM の default タグも無いので必ず値が入る）、createdAt は DEFAULT now()。発熱判定・アラート等の計算や副作用は一切なし

### GET /api/temperature-records/:recordId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `recordId` | string (path param) | ○ | なし |

**レスポンス**: data: TemperatureRecord（単体）

**ステータス**: 200 / 404 (error="体温記録が見つかりません") / 403 (error="この体温記録にアクセスする権限がありません") / 401 / 429 / 500

**所有権**: TemperatureRecordUsecase.ensureOwner: t == nil → NotFound("体温記録")、t.UserID != userID → Forbidden

**ドメイン規則**: SELECT ... WHERE "id" = $1（userId 条件なし）。単なる CRUD の Get。Gin のルーティング上 /temperature-records/member/:memberId が静的セグメント優先で先にマッチするため、recordId に "member" は到達しない（router_smoke_test で登録時 panic しないことを検証済み）

### PATCH /api/temperature-records/:recordId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `recordId` | string (path param) | ○ | なし |
| `temperature` | *float64 | — | 省略/null なら未更新。値域検証なし。0 を送れば 0 で上書きされる（map 更新なので GORM のゼロ値スキップは効かない） |
| `measuredAt` | *string | — | parseDate。省略/null/パース失敗すべて「未更新」になる（Create と違い形式エラーで 400 にならない） |
| `notes` | *string | — | 省略/null なら未更新。NULL に戻す手段が無い |

**レスポンス**: data: TemperatureRecord（更新後に FindByID した値）。更新フィールドが 0 個なら UPDATE を発行せず現在値を返す

**ステータス**: 200 / 400 JSON パース失敗・空 body (error="入力内容が正しくありません") / 404 (error="体温記録が見つかりません") / 403 (error="この体温記録にアクセスする権限がありません") / 401 / 429 / 500

**所有権**: ensureOwner 通過後に UPDATE ... WHERE "id" = ?（userId 条件なし）

**ドメイン規則**: 部分更新のみ。memberId・userId は変更不可。検証・計算・副作用なし

### DELETE /api/temperature-records/:recordId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `recordId` | string (path param) | ○ | なし |

**レスポンス**: data: { ok: true }

**ステータス**: 200 / 404 (error="体温記録が見つかりません") / 403 (error="この体温記録にアクセスする権限がありません") / 401 / 429 / 500

**所有権**: ensureOwner 通過後に DELETE（WHERE は id のみ）

**ドメイン規則**: 物理削除。DELETE FROM "TemperatureRecord" WHERE "id" = ?

### GET /api/body-measurements

**レスポンス**: data: BodyMeasurement[]（0件でも []）。BodyMeasurement = { id: string(UUIDv4), userId: string, memberId: string, weight: number|null(double), height: number|null(double), recordedAt: string(RFC3339), notes: string|null, createdAt: string(RFC3339) }

**ステータス**: 200 / 401 / 429 / 500

**所有権**: WHERE userId = JWT userID

**ドメイン規則**: SELECT ... FROM "BodyMeasurement" WHERE "userId" = $1 ORDER BY "recordedAt" DESC。ページング無し。BMI 等の算出はサーバ側でしていない（フロント側の責務）

### POST /api/body-measurements

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required" — 未指定/空文字は 400 |
| `weight` | *float64 | — | 検証なし。null 可（DB も NULL 許容）。負値・非現実値も通る。weight と height が両方 null のレコードも作成できてしまう（「少なくとも一方必須」の検証は無い） |
| `height` | *float64 | — | 検証なし。null 可。負値も通る |
| `recordedAt` | string | ○ | binding:"required"（空文字は 400）。さらに parseDate が nil を返すと 400 "記録日時の形式が正しくありません"。許容形式は RFC3339 / "2006-01-02T15:04:05" / "2006-01-02" |
| `notes` | *string | — | 検証なし |

**レスポンス**: data: BodyMeasurement（Create 後に FindByID した値）

**ステータス**: 201 / 400 バインド失敗 (error="メンバーIDと記録日時は必須です") / 400 日付形式不正 (error="記録日時の形式が正しくありません") / 403 (error="このメンバーにアクセスする権限がありません") / 404 (error="メンバーが見つかりません") / 401 / 429 / 500

**所有権**: MemberScopedCRUD.Create → ensureMemberOwner。member が nil → 404、他人所有 → 403。通過後に INSERT（別トランザクション）

**ドメイン規則**: ドメイン規則は memberId の所有権確認のみ。id は UUID v4 をサーバ生成、userId は JWT から。recordedAt は TIMESTAMPTZ NOT NULL（DEFAULT 無し）、createdAt は DEFAULT now()。BMI 計算・前回差分などの計算や副作用は一切なし

### GET /api/body-measurements/:measurementId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `measurementId` | string (path param) | ○ | なし |

**レスポンス**: data: BodyMeasurement（単体）

**ステータス**: 200 / 404 (error="身体測定記録が見つかりません") / 403 (error="この身体測定記録にアクセスする権限がありません") / 401 / 429 / 500

**所有権**: MemberScopedCRUD.ensureOwner: nil → NotFound("身体測定記録")、UserID 不一致 → Forbidden

**ドメイン規則**: SELECT ... WHERE "id" = $1（userId 条件なし）。単なる CRUD の Get

### PATCH /api/body-measurements/:measurementId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `measurementId` | string (path param) | ○ | なし |
| `weight` | *float64 | — | 省略/null なら未更新。null 送信で NULL クリアはできない（フロントは weight?: number\|null を送る設計なので意図と食い違う） |
| `height` | *float64 | — | 省略/null なら未更新。NULL クリア不可 |
| `recordedAt` | *string | — | parseDate。省略/null/パース失敗すべて未更新（Create と違い形式エラーで 400 にならない） |
| `notes` | *string | — | 省略/null なら未更新。NULL クリア不可 |

**レスポンス**: data: BodyMeasurement（更新後に FindByID した値）。更新フィールドが 0 個なら UPDATE を発行せず現在値を返す

**ステータス**: 200 / 400 JSON パース失敗・空 body (error="入力内容が正しくありません") / 404 (error="身体測定記録が見つかりません") / 403 (error="この身体測定記録にアクセスする権限がありません") / 401 / 429 / 500

**所有権**: ensureOwner 通過後に UPDATE ... WHERE "id" = ?（userId 条件なし）

**ドメイン規則**: 部分更新のみ。memberId・userId は変更不可。検証・計算・副作用なし

### DELETE /api/body-measurements/:measurementId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `measurementId` | string (path param) | ○ | なし |

**レスポンス**: data: { ok: true }

**ステータス**: 200 / 404 (error="身体測定記録が見つかりません") / 403 (error="この身体測定記録にアクセスする権限がありません") / 401 / 429 / 500

**所有権**: ensureOwner 通過後に DELETE（WHERE は id のみ）

**ドメイン規則**: 物理削除。DELETE FROM "BodyMeasurement" WHERE "id" = ?

## medication-record

### 移植時の注意

【共通契約】
- レスポンスは常に {success:true, data:…} / {success:false, error:"…"}。成功は response.Success=200、作成は response.Created=201。エラーは pkg/response/response.go の HandleDomainError で NotFoundError→404 / ConflictError→409 / ValidationError→400 / ForbiddenError→403 / それ以外→500「サーバーエラーが発生しました」。medication-record 系で 409 を返す経路は存在しない。
- 認証は middleware.Auth（Authorization: Bearer <JWT>）。ヘッダ欠落・不正はすべて 401「認証エラー」。userId は必ず JWT クレームから取得し、ボディの userId は一切受け付けない。
- レート制限は authed グループ全体で middleware.RateLimit("api", 120, 1分, PerUser)。超過は 429「リクエストが多すぎます。しばらくしてから再試行してください。」。実装はプロセス内メモリの sync.Map なので水平スケール時は無効（Java 移植時は分散キャッシュ等の検討が必要）。
- ルート優先順位: /api/medications/alerts（GET）と /api/medications/reorder（POST）は /api/medications/{medicationId} より先に一致する必要がある。Spring では @GetMapping("/medications/alerts") が {medicationId} より優先されるが、Ant パターン順序に依存する構成では明示が必要。

【Java に移すべきドメイン規則（単なる CRUD ではない部分）】
1. 所有権判定が 2 系統ある: (a) Medication/MedicationRecord は自身の userId と JWT userId を直接比較、(b) member 配下エンドポイントは Member.userId を確認したうえで memberId で引く。(b) は SQL に userId 条件が無いため、Member を所有していれば userId の異なる行も返る。
2. POST /api/records の memberId はクライアント値を捨てて Medication.memberId から導出する。
3. POST /api/medications の category 空文字 → "regular" 補完。
4. GET /api/medications/alerts の在庫僅少判定（isActive=TRUE かつ「残数 <= 5」または「stockAlertDate <= now()+7日」、ソートは stockQuantity ASC NULLS LAST, createdAt ASC）。
5. reorder の displayOrder = 配列インデックス、かつ userId スコープ付き UPDATE。
6. 一覧のソート順（薬: displayOrder ASC, createdAt ASC / 記録: takenAt DESC）は UI が依存しているため維持必須。
7. GET /api/records の動的フィルタ（memberId / takenAt >= from / takenAt < to（排他） / days は from を上書き / limit）。
8. 更新時 updatedAt は常に now()、作成時 displayOrder=0・isActive=true・status='active'・takenAt=now() は DB 既定値。

【Go 側の不具合・危うい実装（移植時に是正判断が必要）】
A. PATCH /medications/{id}/stock に検証が皆無。struct が `StockQuantity int`（非ポインタ・binding タグ無し）のため、(1) stockQuantity を省略すると 0 として在庫が消える、(2) 負数がそのまま保存される。にもかかわらずエラーメッセージは「在庫数は0以上の数値を指定してください」で、実際には一度も検証していない。
B. POST /medications/reorder に usecase レベルの所有権チェックが無い。防御は repository の `WHERE "id" = ? AND "userId" = ?` だけで、他人の薬 ID や存在しない ID を渡してもエラーにならず 200 {ok:true} を返す（サイレント失敗）。orderedIds の件数上限も無く、1 件ずつ UPDATE をループするため巨大配列で長時間トランザクションになる。空配列 [] は binding:"required" を通過して no-op。
C. parseDate（handler/helpers.go）が解釈不能な日付文字列に対して 400 を返さず nil を返すため、「不正な日付」と「未指定」が区別できない。stockAlertDate に "abc" を送ると黙って無視され、GET /records?from=不正 もフィルタ無しの全件取得になる。さらに time.Parse をロケーション指定なしで呼ぶため "2026-01-01" は UTC 0 時扱いになり、JST 前提の日付境界と 9 時間ずれる。
D. GET /api/records はデフォルト limit が無く、パラメータ無しだと当該ユーザーの全服薬履歴を返す（フロントの履歴画面が実際にパラメータ無しで叩いている）。limit の上限ガードも無い。また from と days を同時指定すると days が from を上書きする（後勝ち）仕様が明文化されていない。
E. isActive と status が二重管理で同期処理が無い。PATCH で status='paused' にしても isActive は true のままなので、/medications/alerts（isActive=TRUE 条件）や /members/summary の activeMedicationCount には「休薬中」の薬が含まれ続ける。一方 schedule_repository.go:154 の今日の予定クエリだけが `m."status" NOT IN ('paused','discontinued')` で除外しており、リソース間で判定基準が食い違っている。Java 側では status を単一の真実にするか、両者の整合を明示的に保つべき。
F. category / status に列挙値検証が無く任意文字列を保存できる（想定値は migration 0007 のコメントにある active/paused/discontinued のみ）。name の max=200 も POST だけで、PATCH には binding タグが無いため長さ無制限で更新できる。
G. bind 失敗時のエラーメッセージが原因を問わず固定文字列（例: name が 201 文字でも「薬の名前とメンバーIDは必須です」）。Java 側で Bean Validation に置き換えるとメッセージが変わるためフロントの文言依存に注意。
H. 所有権チェックと書き込みが別トランザクション（ensureMedOwner → UPDATE/DELETE）で TOCTOU がある。さらに Update/UpdateStock は UPDATE 後に FindByID し直すため、その間に行が消えると `{"success":true,"data":null}` を 200 で返す（クライアントが null を想定していない可能性）。
I. DELETE /medications/{id} は物理削除で、FK の ON DELETE CASCADE により Schedule と MedicationRecord（服薬履歴）まで連鎖削除される。アプリコードに連鎖の記述が無いため、Java + JPA へ移す際に DB 制約に依存し続けるのか明示的に削除するのかを決めないと、履歴が消えない／二重に消えるといった差異が出る。
J. POST /records の scheduleId が無検証。MedicationRecord."scheduleId" は TEXT で FK も無いため、他人の scheduleId や存在しない ID をそのまま保存できる（参照整合性の穴）。
K. "Medication"."userId" は NOT NULL だが FK 制約が無い（"memberId" のみ Member への FK）。MedicationRecord."userId" は User への FK + CASCADE があるのと非対称で、ユーザー削除時に Medication 行が孤児として残る。
L. intervalHours 列はレスポンスに含まれるが、書き込む API が 1 つも存在しない（Create/Update の入力にも無い）ため常に null。移植時に落とすか API を用意するかの判断が必要。
M. 服薬記録の作成が在庫 stockQuantity を減らさない（記録と在庫が連動していない）。逆に記録削除でも在庫は戻らない。仕様なのか漏れなのか要確認。
N. prescription の Dispense（POST /prescriptions/{id}/dispense、担当外だが Medication を作成する経路）は MedicationRepository.Create をループで呼ぶだけでトランザクションが無く、途中で失敗すると薬が部分的に作成されたまま 500 になる。Medication を作る経路が medication-record 以外にもある点は移植時に見落としやすい。

### GET /api/medications

**レスポンス**: data = Medication[] （空でも null にならず [] を返す）。Medication = { id: string, memberId: string, userId: string, name: string, category: string, dosageAmount: string|null, frequency: string|null, stockQuantity: number|null, stockAlertDate: string(ISO8601 timestamptz)|null, intervalHours: number|null, instructions: string|null, displayOrder: number, isActive: boolean, status: string, createdAt: string, updatedAt: string }

**ステータス**: 200 成功 / 401 "認証エラー"(Bearer 無し・JWT不正) / 429 "リクエストが多すぎます。しばらくしてから再試行してください。" / 500 "サーバーエラーが発生しました"

**所有権**: usecase では所有権チェック無し。SQL の WHERE "userId" = $1 のみで自分の薬に限定 (sqlc ListMedicationsByUser)。

**ドメイン規則**: 並び順は ORDER BY "displayOrder" ASC, "createdAt" ASC 固定。件数上限・ページングは無し（全件返却）。isActive / status による絞り込みはサーバ側では一切行わない（休薬・中止も含めて全件返す）。

### GET /api/medications/alerts

**レスポンス**: data = Medication[]（GET /api/medications と同一の Medication 形状）

**ステータス**: 200 成功 / 401 / 429 / 500

**所有権**: SQL の WHERE "userId"=$1 のみ。usecase 側チェック無し (MedicationUsecase.ListAlerts は素通し)。

**ドメイン規則**: 在庫アラート判定は生SQL (aggregate_queries.go ListAlerts): WHERE "userId"=$1 AND "isActive" = TRUE AND ( ("stockQuantity" IS NOT NULL AND "stockQuantity" <= 5) OR ("stockAlertDate" IS NOT NULL AND "stockAlertDate" <= now() + interval '7 days') )。閾値 5 は定数 lowStockThreshold、期間は 7 日固定。stockAlertDate は過去日も条件を満たす（下限なし）。並び順は ORDER BY "stockQuantity" ASC NULLS LAST, "createdAt" ASC。status（paused/discontinued）は判定に使われず isActive のみで絞る。

### GET /api/medications/{medicationId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `medicationId` | string (path param) | ○ | バリデーション無し。存在しなければ 404 |

**レスポンス**: data = Medication（単体オブジェクト）

**ステータス**: 200 成功 / 401 / 403 "この薬にアクセスする権限がありません" / 404 "薬が見つかりません" / 429 / 500

**所有権**: MedicationUsecase.ensureMedOwner: id で FindByID → nil なら NotFound("薬") → m.UserID != userID なら Forbidden。memberId 経由ではなく Medication.userId 直接比較。

**ドメイン規則**: 取得のみ。副作用なし。

### POST /api/medications

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required"。空文字・キー欠落は 400。存在/所有権は usecase で確認 |
| `name` | string | ○ | binding:"required,max=200"。201文字以上は 400（ただしメッセージは「薬の名前とメンバーIDは必須です」固定） |
| `category` | string | — | バリデーション無し。空文字/未指定なら usecase で "regular" を代入。列挙値チェックは無し |
| `dosageAmount` | string|null | — | 検証なし。長さ制限なし |
| `frequency` | string|null | — | 検証なし |
| `stockQuantity` | number|null | — | 検証なし。負数もそのまま保存される |
| `stockAlertDate` | string|null | — | parseDate で RFC3339 / "2006-01-02T15:04:05" / "2006-01-02" の順に time.Parse。どれにも合致しなければエラーにせず nil（＝未指定扱い）。ロケーション指定なしのため日付のみ文字列は UTC 0時として解釈 |
| `instructions` | string|null | — | 検証なし |

**レスポンス**: data = Medication（作成後に FindByID で再取得した完全な行。displayOrder=0, isActive=true, status="active", createdAt/updatedAt=now() が DB 既定値で入る）

**ステータス**: 201 作成 / 400 "薬の名前とメンバーIDは必須です"（JSONパース不能・binding違反すべて同一メッセージ） / 401 / 403 "このメンバーにアクセスする権限がありません" / 404 "メンバーが見つかりません" / 429 / 500

**所有権**: ensureMemberOwner(members, in.UserID, in.MemberID): Member を FindByID → nil なら NotFound("メンバー") → member.UserID != 認証ユーザー なら Forbidden。userId はリクエストボディからではなく JWT から取得して保存。

**ドメイン規則**: category 空 → "regular" 補完のみがドメイン規則。displayOrder / isActive / status / intervalHours はリクエストで指定不可、DB 既定値 (0 / TRUE / 'active' / NULL) に委ねる（GORM の default タグでゼロ値を INSERT から除外）。ID は auth.NewID() でアプリ側採番（DB 側 default なし、TEXT PRIMARY KEY）。

### PATCH /api/medications/{medicationId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `medicationId` | string (path param) | ○ | 存在しなければ 404 |
| `name` | string|null | — | binding タグ無し。create と違い max=200 が効かない（PATCH なら 200 文字超も保存可能）。null/未指定なら未更新 |
| `category` | string|null | — | 検証なし。任意文字列を保存可能 |
| `dosageAmount` | string|null | — | 検証なし |
| `frequency` | string|null | — | 検証なし |
| `stockQuantity` | number|null | — | 検証なし。負数可 |
| `stockAlertDate` | string|null | — | parseDate。解釈不能な文字列は nil になり「未指定」と区別されず無視される |
| `instructions` | string|null | — | 検証なし |
| `isActive` | boolean|null | — | 検証なし |
| `status` | string|null | — | 検証なし。'active'/'paused'/'discontinued' は migration 0007 のコメント上の想定値にすぎず、コード上の enum チェックは存在しない |

**レスポンス**: data = Medication（更新後に FindByID で再取得）。同時削除等で行が消えていた場合は data: null で 200 が返る

**ステータス**: 200 成功 / 400 "入力内容が正しくありません"（JSON パース失敗時のみ。ボディ空の場合も EOF で 400、{} は成功） / 401 / 403 "この薬にアクセスする権限がありません" / 404 "薬が見つかりません" / 429 / 500

**所有権**: ensureMedOwner（Medication.userId == JWT userId）。所有権確認と UPDATE は別トランザクション（TOCTOU）。

**ドメイン規則**: nil でないフィールドのみ UPDATE する部分更新。updatedAt は更新項目の有無に関わらず常に now() を設定（{} を送っただけでも updatedAt が進む）。memberId / userId / displayOrder / intervalHours は更新不可。isActive と status を同期させるロジックは無い（status=paused にしても isActive は true のまま）。

### PATCH /api/medications/{medicationId}/stock

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `medicationId` | string (path param) | ○ | 存在しなければ 404 |
| `stockQuantity` | number (int, 非ポインタ) | — | binding タグ無し。キー省略・null は Go のゼロ値 0 として扱われ在庫が 0 に上書きされる。負数チェックも無い（エラーメッセージは「在庫数は0以上の数値を指定してください」だが実際には未検証） |

**レスポンス**: data = Medication（更新後の完全な行。行が消えていれば data: null）

**ステータス**: 200 成功 / 400 "在庫数は0以上の数値を指定してください"（JSON 不正・型不一致のときのみ） / 401 / 403 "この薬にアクセスする権限がありません" / 404 "薬が見つかりません" / 429 / 500

**所有権**: ensureMedOwner（Medication.userId == JWT userId）。

**ドメイン規則**: 絶対値の上書き（増減ではない）。UPDATE "Medication" SET "stockQuantity"=?, "updatedAt"=now() WHERE "id"=?。在庫アラートの再計算・通知等の副作用は無し。

### POST /api/medications/reorder

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `orderedIds` | string[] | ○ | binding:"required"。ただし slice の required は nil 判定のみのため、キー欠落/null は 400、空配列 [] は通過して no-op。要素数の上限・重複チェック・存在チェックは無し |

**レスポンス**: data = { ok: true }（並び替え後の Medication は返さない）

**ステータス**: 200 成功 / 400 "並び順の指定が正しくありません" / 401 / 429 / 500。403 / 404 は返らない

**所有権**: usecase には所有権チェックが無い。リポジトリの UPDATE ... WHERE "id" = ? AND "userId" = ? のみで防御しているため、他人の ID や存在しない ID を混ぜてもエラーにならず黙って無視され 200 { ok: true } が返る。

**ドメイン規則**: 配列のインデックス i を displayOrder に設定（0 始まり）。GORM の Transaction 内で 1 件ずつ UPDATE をループ（N クエリ）。updatedAt も同時に now()。指定されなかった薬の displayOrder は据え置きのため、部分配列を送ると displayOrder が重複しうる（一覧は displayOrder ASC, createdAt ASC で解決）。

### DELETE /api/medications/{medicationId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `medicationId` | string (path param) | ○ | 存在しなければ 404 |

**レスポンス**: data = { ok: true }

**ステータス**: 200 成功 / 401 / 403 "この薬にアクセスする権限がありません" / 404 "薬が見つかりません" / 429 / 500

**所有権**: ensureMedOwner（Medication.userId == JWT userId）。

**ドメイン規則**: 物理削除（DELETE FROM "Medication" WHERE "id"=?）。論理削除・status 変更ではない。DB の FK により "Schedule"."medicationId" と "MedicationRecord"."medicationId" が ON DELETE CASCADE で連鎖削除され、服薬履歴も消える（アプリ側に明示的な連鎖処理コードは無い＝Java 移植時は JPA/DB どちらで担保するか要決定）。

### GET /api/members/{memberId}/medications

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string (path param) | ○ | 存在しなければ 404 |

**レスポンス**: data = Medication[]

**ステータス**: 200 成功 / 401 / 403 "このメンバーにアクセスする権限がありません" / 404 "メンバーが見つかりません" / 429 / 500

**所有権**: ensureMemberOwner でメンバーの所有者を確認した後、SQL は WHERE "memberId" = $1 のみ（userId 条件なし）。したがって memberId が一致すれば userId が異なる行も返る。

**ドメイン規則**: ORDER BY "displayOrder" ASC, "createdAt" ASC。フィルタ・ページングなし。

### GET /api/records

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string (query) | — | 空文字/未指定なら絞り込みなし。指定時のみ所有権チェックが走る |
| `from` | string (query) | — | parseDate（RFC3339 / 2006-01-02T15:04:05 / 2006-01-02）。解釈不能なら 400 ではなく黙って無視。条件は "takenAt" >= from |
| `to` | string (query) | — | parseDate。条件は "takenAt" < to（上限は排他的）。解釈不能なら無視 |
| `days` | string (query, 整数) | — | strconv.Atoi が成功し d > 0 のときのみ有効。From = time.Now().AddDate(0,0,-d) を代入するため from パラメータを上書きする。非数値・0・負数は無視 |
| `limit` | string (query, 整数) | — | Atoi 成功かつ l > 0 のときのみ LIMIT に反映。上限値のガードは無く、未指定なら無制限 |

**レスポンス**: data = MedicationRecord[]（空でも []）。MedicationRecord = { id: string, memberId: string, medicationId: string, userId: string, scheduleId: string|null, takenAt: string(ISO8601), notes: string|null, dosageAmount: string|null }

**ステータス**: 200 成功 / 401 / 403 "このメンバーにアクセスする権限がありません"（memberId 指定時のみ） / 404 "メンバーが見つかりません"（memberId 指定時のみ） / 429 / 500

**所有権**: ベースは常に WHERE "userId"=$1（JWT のユーザー）。memberId クエリが空でないときだけ ensureMemberOwner を追加実行。

**ドメイン規則**: 動的 SQL 組み立て（aggregate_queries.go ListByUserFiltered）。条件は userId AND [memberId] AND [takenAt >= from] AND [takenAt < to]、ORDER BY "takenAt" DESC、LIMIT は limit>0 のときだけ付与。パラメータ無しだと全期間・全件返却。

### GET /api/members/{memberId}/records

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string (path param) | ○ | 存在しなければ 404 |

**レスポンス**: data = MedicationRecord[]

**ステータス**: 200 成功 / 401 / 403 "このメンバーにアクセスする権限がありません" / 404 "メンバーが見つかりません" / 429 / 500

**所有権**: ensureMemberOwner のみ。SQL は WHERE "memberId" = $1 だけで userId 条件が無いため、memberId 一致なら userId が異なる行も返る（GET /api/records?memberId=… と結果が食い違いうる）。

**ドメイン規則**: ORDER BY "takenAt" DESC。期間・件数フィルタは無し（全件）。

### POST /api/records

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | — | 受け取るが usecase で med.MemberID に上書きされ完全に無視される（クライアント値は使わない） |
| `medicationId` | string | ○ | binding:"required"。欠落・空文字は 400 |
| `scheduleId` | string|null | — | 検証なし。Schedule の存在確認も所有権確認も無く、DB 側にも FK が無い（"scheduleId" TEXT のみ）ので任意文字列が保存される |
| `notes` | string|null | — | 検証なし。長さ制限なし |
| `dosageAmount` | string|null | — | 検証なし。薬側の dosageAmount を自動コピーする処理は無い |
| `takenAt` | string|null | — | parseDate。未指定/解釈不能なら nil → DB 既定値 now() が入る。未来日時のチェック無し。ロケーション指定なしのため日付のみ文字列は UTC 0時 |

**レスポンス**: data = MedicationRecord（作成後に FindByID で再取得した完全な行。memberId はサーバが薬から導出した値）

**ステータス**: 201 作成 / 400 "薬の指定は必須です" / 401 / 403 "この薬にアクセスする権限がありません" / 404 "薬が見つかりません" / 429 / 500

**所有権**: RecordUsecase.Create: medicationId で Medication を FindByID → nil なら NotFound("薬") → med.UserID != 認証ユーザー なら Forbidden。Member 側の所有権は薬経由で担保。userId は JWT、memberId は med.MemberID をサーバ側で設定。

**ドメイン規則**: memberId のサーバ側導出（in.MemberID = med.MemberID）が唯一のドメイン計算。在庫（stockQuantity）の自動減算は行わない。同一薬・同一時刻の重複記録の防止や、scheduleId 単位の一意制約も無い。ID は auth.NewID() でアプリ採番。

### DELETE /api/records/{recordId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `recordId` | string (path param) | ○ | 存在しなければ 404 |

**レスポンス**: data = { ok: true }

**ステータス**: 200 成功 / 401 / 403 "この記録にアクセスする権限がありません" / 404 "記録が見つかりません" / 429 / 500

**所有権**: MedicationRecord.userId == JWT userId を FindByID 後に比較。memberId 経由の判定はしない。

**ドメイン規則**: 物理削除。在庫の戻し（stockQuantity の復元）等の副作用は無し。

## medication-record（薬 Medication + 服薬記録 MedicationRecord）

### 移植時の注意

【ファイル】ルート: backend/internal/interface/router/router.go 77-97行（medication/record は全て router.go にあり routes_ext.go には無い）。handler: internal/interface/handler/medication_handler.go, record_handler.go, helpers.go(parseDate)。usecase: internal/usecase/medication_usecase.go, record_usecase.go, ownership_ext.go(ensureMemberOwner)。repository: internal/infrastructure/persistence/medication_repository.go, medication_record_repository.go, aggregate_queries.go(ListAlerts / ListByUserFiltered), gorm_models.go(136-155, 200-211)。SQL: internal/infrastructure/sqlc/queries/medication.sql, medication_record.sql。DDL: backend/migrations/0001_init.sql 38-86行, 0007_add_missing_columns.sql(status 追加), 0008(updatedAt DEFAULT now())。

【共通契約】全て /api 配下・middleware.Auth(Bearer JWT) 必須。認証失敗は 401 {"success":false,"error":"認証エラー"}。認証済み全 API に PerUser のレート制限 120req/分（超過は 429「リクエストが多すぎます。しばらくしてから再試行してください。」）。成功は 200 {"success":true,"data":...}、作成は 201。HandleDomainError のマッピング: NotFoundError→404 / ConflictError→409 / ValidationError→400 / ForbiddenError→403 / それ以外→500「サーバーエラーが発生しました」。エラーメッセージは日本語でそのまま body に載る（NotFound は "<リソース名>が見つかりません" の組み立て）。一覧系は make([]T, 0, ...) なので必ず [] を返し null にならない。

【DB スキーマと NOT NULL の影響】"Medication": id TEXT PK, memberId TEXT NOT NULL REFERENCES Member(id) ON DELETE CASCADE, userId TEXT NOT NULL（User への FK は無い）, name TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'regular', dosageAmount/frequency/stockAlertDate/intervalHours/instructions は NULL 可, stockQuantity INTEGER NULL, displayOrder INTEGER NOT NULL DEFAULT 0, isActive BOOLEAN NOT NULL DEFAULT TRUE, status TEXT NOT NULL DEFAULT 'active', createdAt/updatedAt TIMESTAMPTZ NOT NULL DEFAULT now()。"MedicationRecord": id TEXT PK, memberId/medicationId/userId いずれも TEXT NOT NULL + FK ON DELETE CASCADE（userId は User への FK あり）, scheduleId TEXT（FK 無し）, takenAt TIMESTAMPTZ NOT NULL DEFAULT now(), notes/dosageAmount NULL 可。NOT NULL + DEFAULT のカラムは Go 側が値を渡さず DB 既定値に委ねている（GORM の default タグでゼロ値を INSERT から除外）ため、Java(JPA) 移植では @Column(insertable=false) 相当か、明示的に同じ既定値（displayOrder=0, isActive=true, status='active', category='regular', takenAt=now()）をアプリ側で設定しないと挙動が変わる。

【Java に移すべきドメイン規則（単なる CRUD ではない部分）】
1. 在庫アラート判定（GET /medications/alerts）: isActive=TRUE かつ (stockQuantity<=5 または stockAlertDate<=now()+7日)。並び順 stockQuantity ASC NULLS LAST, createdAt ASC。
2. 薬作成時 category 空文字→"regular" の補完。
3. 服薬記録作成時 memberId を薬から自動導出しクライアント値を無視。
4. 並び替え（reorder）: 配列インデックスを displayOrder に採番、トランザクション内で一括更新、SQL 側で userId 一致を強制。
5. 一覧の既定ソート: 薬は displayOrder ASC → createdAt ASC、記録は takenAt DESC。
6. 記録フィルタの境界: from は >=（以上）、to は <（未満・排他）、days は from を上書き。
7. 所有権チェックの2系統: 薬/記録は「自身の userId 一致」、メンバー配下一覧と薬作成は ensureMemberOwner（メンバーの userId 一致）。

【Go 側で見つかった不具合・危うい実装（移植時に踏襲すべきか要判断）】
1. PATCH /medications/:id/stock の stockQuantity が非ポインタ int かつ binding タグ無し。ボディを {} にすると 0 で確定上書きされ在庫が消える。エラーメッセージは「在庫数は0以上の数値を指定してください」と言いながら負値の検証を一切していない（-5 も保存される）。Java 側では @NotNull @Min(0) を入れるべき。
2. PATCH /medications/:id の status に列挙値検証が無い。フロントは active/paused/discontinued の3値前提（frontend/src/entities/medication/model/status.ts）だが、サーバは任意文字列を受理して DB に書き込む。
3. status と isActive が同期していない。移行 SQL 0007 は isActive=FALSE→status='paused' として整合を取ったが、以後の Update は片方だけ変えられる。結果として status='discontinued'（中止）の薬でも isActive=TRUE のままなら /medications/alerts の在庫アラートに出続ける。
4. Reorder に usecase レベルの所有権チェックが無く、他人の ID や存在しない ID を混ぜても 0 件更新のまま 200 {"ok":true} が返る（サイレント成功）。またループ内 N 回 UPDATE で件数分クエリが飛ぶ。
5. displayOrder はユーザー全体で共有の連番。メンバー別画面で並び替えると他メンバーの薬と番号が衝突し、ORDER BY displayOrder, createdAt の結果が不安定になりうる。
6. POST /records の scheduleId が未検証。DB にも FK が無いため、他人の scheduleId や存在しない ID をそのまま保存できる（データ整合性の穴）。
7. parseDate が失敗を握り潰す（helpers.go）。"2026-13-45" のような不正日付や "20260816" は 400 にならず nil = 未指定として扱われる。takenAt では「不正 → 黙って now()」、stockAlertDate では「不正 → 黙って更新スキップ」になり、クライアントは成功したと誤認する。
8. parseDate のレイアウト "2006-01-02" / "2006-01-02T15:04:05" はタイムゾーン情報が無く time.Parse が UTC として解釈する。日本のユーザーが "2026-08-16" を送ると 2026-08-16T00:00:00Z = JST 09:00 として保存され、日付境界がずれる。一方 days フィルタは time.Now()（サーバローカル TZ）基準なので、基準時刻の系統が混在している。
9. Update/Create の PATCH セマンティクスでは nil ポインタ = 未指定なので、JSON で null を送っても dosageAmount 等の NULL クリアができない（一度入れた値を消す手段が API に無い）。
10. Update は変更フィールドが 0 個でも updatedAt = now() を必ず打つ。空 PATCH で更新日時だけ進む。
11. bind エラー時のメッセージが固定文言で、実際の原因と食い違う。例: POST /medications で name が 201 文字だと「薬の名前とメンバーIDは必須です」と返る。
12. Create/Update/UpdateStock は「GORM で書き込み → 別コネクション(pgx pool)の sqlc FindByID で再取得」の2クエリ構成でトランザクションが無い。並行更新時に自分が書いた値と異なるレスポンスを返しうる。また Create 直後に FindByID が nil を返した場合、エラーではなく data: null の 201 が返る（nil ポインタがそのまま JSON 化される）。
13. DELETE /medications/:id は FK ON DELETE CASCADE により Schedule と MedicationRecord を連鎖削除する。この副作用はアプリコードのどこにも書かれておらず DB 制約頼み。Java 移植時に FK を張らない／RESTRICT にすると挙動が変わる（服薬履歴が残る or 削除が失敗する）。逆に警告や確認も無いので、履歴が黙って全消えする現仕様自体が危うい。
14. 削除系のレスポンスが 204 ではなく 200 + {"ok":true}。フロントの互換のため踏襲が必要。
15. ID 不一致時に 404 ではなく 403 を返す設計（他人の薬 ID → 「この薬にアクセスする権限がありません」）。ID の存在有無が漏れる。既存フロントの分岐に影響するため変更する場合は要調整。
16. usecase の RecordUsecase.ListByUser は handler から呼ばれていないデッドコード（handler は常に ListFiltered を使う）。移植不要。
17. 参考: Medication の作成経路は POST /medications 以外に POST /prescriptions/:id/dispense（PrescriptionUsecase.Dispense、backend/internal/usecase/prescription_usecase.go:82-106）もあり、category="regular" 固定でループ作成する。こちらもトランザクション無しで、途中で失敗すると作成済みの薬が残る。medication-record 側の Create 実装を共有する形で移植すると影響範囲になる。

### GET /api/medications

**レスポンス**: data: Medication[]（空でも null ではなく []）。Medication = { id: string, memberId: string, userId: string, name: string, category: string, dosageAmount: string|null, frequency: string|null, stockQuantity: number|null, stockAlertDate: string(RFC3339)|null, intervalHours: number|null, instructions: string|null, displayOrder: number, isActive: boolean, status: string, createdAt: string(RFC3339), updatedAt: string(RFC3339) }

**ステータス**: 200 成功 / 401 認証エラー(Bearer 無し・無効) / 429 レート制限 / 500 サーバーエラーが発生しました

**所有権**: SQL の WHERE "userId" = $1 のみでフィルタ。usecase 側の追加チェックは無し（handler の middleware.UserID(c) をそのまま使用）

**ドメイン規則**: sqlc ListMedicationsByUser。ORDER BY "displayOrder" ASC, "createdAt" ASC。休薬中(paused)/中止(discontinued)も含めて全件返す（絞り込みはフロント側の責務）

### GET /api/medications/alerts

**レスポンス**: data: Medication[]（/api/medications と同一の Medication 形）

**ステータス**: 200 成功 / 401 / 429 / 500 サーバーエラーが発生しました

**所有権**: WHERE "userId" = $1 のみ。usecase での所有権チェック無し

**ドメイン規則**: 在庫アラート判定（Java へ移すべきドメイン規則）: WHERE userId=$1 AND isActive = TRUE AND ( (stockQuantity IS NOT NULL AND stockQuantity <= 5) OR (stockAlertDate IS NOT NULL AND stockAlertDate <= now() + interval '7 days') )。閾値 lowStockThreshold = 5（定数）、アラート日は 7日以内。ORDER BY "stockQuantity" ASC NULLS LAST, "createdAt" ASC。判定は isActive のみで、status(paused/discontinued) は考慮しない

### GET /api/medications/:medicationId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `medicationId` | string (path param) | ○ | 検証なし。存在しなければ 404 |

**レスポンス**: data: Medication（単体オブジェクト）

**ステータス**: 200 / 401 / 403 この薬にアクセスする権限がありません / 404 薬が見つかりません / 429 / 500

**所有権**: ensureMedOwner: medications.FindByID(id) → nil なら NotFound("薬") → m.UserID != userID なら Forbidden("この薬にアクセスする権限がありません")。ID 一意検索なので他人の ID を投げると 403（存在が漏れる）

**ドメイン規則**: 単純な取得。追加の計算なし

### POST /api/medications

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required"（空文字不可）。失敗時は一律 400「薬の名前とメンバーIDは必須です」 |
| `name` | string | ○ | binding:"required,max=200"（200文字超で 400） |
| `category` | string | — | binding タグなし。列挙値検証なし。空文字なら usecase で "regular" に補完 |
| `dosageAmount` | string|null | — | 検証なし |
| `frequency` | string|null | — | 検証なし |
| `stockQuantity` | number|null (*int) | — | 検証なし。負値も通る |
| `stockAlertDate` | string|null | — | parseDate で RFC3339 / "2006-01-02T15:04:05" / "2006-01-02" を試行。どれにも一致しなければエラーではなく silently nil |
| `instructions` | string|null | — | 検証なし |

**レスポンス**: data: Medication（作成後に FindByID で再読込した値。DB 既定値が反映済み: displayOrder=0, isActive=true, status='active', category='regular', createdAt/updatedAt=now()）

**ステータス**: 201 Created / 400 薬の名前とメンバーIDは必須です（bind 失敗は理由を問わずこの1文） / 401 / 403 このメンバーにアクセスする権限がありません / 404 メンバーが見つかりません / 429 / 500

**所有権**: ensureMemberOwner(userID, req.memberId): members.FindByID → nil なら NotFound("メンバー")、m.UserID != userID なら Forbidden("このメンバーにアクセスする権限がありません")

**ドメイン規則**: category が空文字なら "regular" を代入（usecase の唯一のドメイン規則）。userId は JWT 由来でリクエストからは受け取らない。intervalHours / displayOrder / isActive / status は API から設定不可（DB 既定値に委譲）。GORM Create → 直後に sqlc FindByID で再取得して返す（2クエリ・トランザクション無し）

### PATCH /api/medications/:medicationId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `medicationId` | string (path param) | ○ | - |
| `name` | string|null | — | binding タグなし。Create にある max=200 が Update には無い（長さ無制限） |
| `category` | string|null | — | 検証なし |
| `dosageAmount` | string|null | — | 検証なし |
| `frequency` | string|null | — | 検証なし |
| `stockQuantity` | number|null (*int) | — | 検証なし。負値も通る |
| `stockAlertDate` | string|null | — | parseDate。パース不能なら nil = 未指定扱いで無視される |
| `instructions` | string|null | — | 検証なし |
| `isActive` | boolean|null | — | 検証なし |
| `status` | string|null | — | 列挙値の検証なし。フロントは active/paused/discontinued の3値を送るがサーバは任意文字列を受理 |

**レスポンス**: data: Medication（更新後に FindByID で再取得した全フィールド）

**ステータス**: 200 / 400 入力内容が正しくありません（JSON 不正時） / 401 / 403 この薬にアクセスする権限がありません / 404 薬が見つかりません / 429 / 500

**所有権**: ensureMedOwner で薬の userId == 認証 userId を確認してから UPDATE。UPDATE 文自体の WHERE は "id" = ? のみ（userId 条件なし。usecase の事前チェットに依存）

**ドメイン規則**: 部分更新。nil ポインタのフィールドは SET 句に含めない → JSON で null を送っても既存値の NULL クリアはできない。updatedAt は変更有無に関わらず常に now()（空更新でも updatedAt が進む）。isActive と status の同期処理は無し

### PATCH /api/medications/:medicationId/stock

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `medicationId` | string (path param) | ○ | - |
| `stockQuantity` | number (int, 非ポインタ) | — | binding タグ無し。min=0 等の検証は一切なし。フィールドを省略すると Go のゼロ値 0 で在庫が 0 に更新される。負値も保存される |

**レスポンス**: data: Medication（更新後の全フィールド）

**ステータス**: 200 / 400 在庫数は0以上の数値を指定してください（JSON 型不正時のみ。実際には 0 以上の検証はしていない） / 401 / 403 / 404 薬が見つかりません / 429 / 500

**所有権**: ensureMedOwner で確認後、UPDATE "Medication" SET stockQuantity, updatedAt=now() WHERE "id" = ?

**ドメイン規則**: stockQuantity を絶対値で上書き（増減ではない）。updatedAt=now()。在庫がアラート閾値を下回っても通知等の副作用は無し

### POST /api/medications/reorder

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `orderedIds` | string[] | ○ | binding:"required"（null / 空配列 [] は 400）。要素の存在チェック・所有権チェック・重複チェックは無し |

**レスポンス**: data: { ok: true }

**ステータス**: 200 / 400 並び順の指定が正しくありません / 401 / 429 / 500

**所有権**: usecase では所有権チェックをせず repository に丸投げ。SQL 側で WHERE "id" = ? AND "userId" = ? を付けているため他人の薬は更新されないが、該当0件でもエラーにならず 200 が返る

**ドメイン規則**: GORM Transaction 内で orderedIds を先頭からループし displayOrder = 配列インデックス i、updatedAt = now() を1件ずつ UPDATE（N クエリ）。displayOrder はユーザー全体で共有の連番であり、メンバー単位ではない。送られなかった薬の displayOrder は据え置きなので順序が重複しうる

### DELETE /api/medications/:medicationId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `medicationId` | string (path param) | ○ | - |

**レスポンス**: data: { ok: true }（204 ではなく 200 + ボディ）

**ステータス**: 200 / 401 / 403 この薬にアクセスする権限がありません / 404 薬が見つかりません / 429 / 500

**所有権**: ensureMedOwner 後に DELETE FROM "Medication" WHERE "id" = ?（DELETE 文に userId 条件は無い）

**ドメイン規則**: 物理削除。DB の FK ON DELETE CASCADE により "Schedule"(medicationId) と "MedicationRecord"(medicationId) が連鎖削除される → 服薬履歴が黙って消える。アプリコードには連鎖削除の記述が無いので Java 移植時は DB 制約か明示削除のどちらかで再現が必要

### GET /api/members/:memberId/medications

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string (path param) | ○ | - |

**レスポンス**: data: Medication[]

**ステータス**: 200 / 401 / 403 このメンバーにアクセスする権限がありません / 404 メンバーが見つかりません / 429 / 500

**所有権**: ensureMemberOwner(userID, memberId) を先に実行。その後の SQL は WHERE "memberId" = $1 のみで userId 条件なし（メンバー所有権チェックが唯一のガード）

**ドメイン規則**: sqlc ListMedicationsByMember。ORDER BY "displayOrder" ASC, "createdAt" ASC

### GET /api/records

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string (query) | — | 空文字なら未指定扱い（全メンバー）。指定時のみ所有権チェックが走る |
| `from` | string (query) | — | parseDate（RFC3339 / yyyy-MM-ddTHH:mm:ss / yyyy-MM-dd）。パース不能なら nil = 条件なし。takenAt >= from（以上） |
| `to` | string (query) | — | 同上。takenAt < to（未満・排他） |
| `days` | string(整数) (query) | — | strconv.Atoi 成功かつ d > 0 のときのみ有効。from = time.Now().AddDate(0,0,-d) を代入し、先に指定された from を上書きする |
| `limit` | string(整数) (query) | — | Atoi 成功かつ l > 0 のときのみ適用。不正値・0以下は無視され無制限 |

**レスポンス**: data: MedicationRecord[]。MedicationRecord = { id: string, memberId: string, medicationId: string, userId: string, scheduleId: string|null, takenAt: string(RFC3339), notes: string|null, dosageAmount: string|null }

**ステータス**: 200 / 401 / 403 このメンバーにアクセスする権限がありません（memberId 指定時） / 404 メンバーが見つかりません（memberId 指定時） / 429 / 500

**所有権**: memberId が空でない場合のみ ensureMemberOwner。SQL は常に WHERE "userId"=$1 が付くので memberId 未指定でも他人のデータは出ない

**ドメイン規則**: 動的 SQL 組み立て（ListByUserFiltered）: SELECT ... FROM "MedicationRecord" WHERE "userId"=$1 [AND "memberId"=$n] [AND "takenAt" >= $n] [AND "takenAt" < $n] ORDER BY "takenAt" DESC [LIMIT n]。LIMIT のみ文字列連結（値は strconv.Itoa 済みの整数なので注入は不可）。フィルタ未指定なら全件（後方互換）

### POST /api/records

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `medicationId` | string | ○ | binding:"required"。失敗時 400「薬の指定は必須です」 |
| `memberId` | string | — | リクエスト構造体には存在するが handler が usecase に渡さず、usecase が med.MemberID で必ず上書きする → クライアント指定値は完全に無視される |
| `scheduleId` | string|null | — | 検証なし。存在確認も所有権確認もしない。DB にも FK 制約なし（"scheduleId" TEXT のみ） |
| `notes` | string|null | — | 検証なし・長さ制限なし |
| `dosageAmount` | string|null | — | 検証なし |
| `takenAt` | string|null | — | parseDate。パース不能・未指定なら nil → DB 既定値 now() が入る。未来日時も過去日時も無検証で受理 |

**レスポンス**: data: MedicationRecord（作成後 FindByID で再取得。takenAt は DB 既定値適用後の値）

**ステータス**: 201 Created / 400 薬の指定は必須です / 401 / 403 この薬にアクセスする権限がありません / 404 薬が見つかりません / 429 / 500

**所有権**: 薬経由の所有権確認: medications.FindByID(medicationId) → nil なら NotFound("薬")、med.UserID != 認証 userID なら Forbidden。メンバー所有権は薬の所有権から間接的に担保

**ドメイン規則**: memberId を med.MemberID から自動導出（Java でも必須のドメイン規則）。userId は JWT 由来。takenAt 未指定は DB now()。服薬記録を作成しても Medication.stockQuantity は減らない（在庫の自動減算という副作用は存在しない）。重複記録（同一 medicationId + 同一時刻）のガードも無し

### DELETE /api/records/:recordId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `recordId` | string (path param) | ○ | - |

**レスポンス**: data: { ok: true }

**ステータス**: 200 / 401 / 403 この記録にアクセスする権限がありません / 404 記録が見つかりません / 429 / 500

**所有権**: records.FindByID(id) → nil なら NotFound("記録")、rec.UserID != userID なら Forbidden。その後の DELETE は WHERE "id" = ? のみ

**ドメイン規則**: 物理削除。在庫の巻き戻し等の副作用なし

### GET /api/members/:memberId/records

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string (path param) | ○ | - |

**レスポンス**: data: MedicationRecord[]

**ステータス**: 200 / 401 / 403 このメンバーにアクセスする権限がありません / 404 メンバーが見つかりません / 429 / 500

**所有権**: ensureMemberOwner(userID, memberId) のみ。SQL は WHERE "memberId" = $1 で userId 条件なし

**ドメイン規則**: sqlc ListMedicationRecordsByMember。ORDER BY "takenAt" DESC。件数上限なし（全件返す）

## member-user

### 移植時の注意

【ルート登録場所】/api/members 系は router.go:71-78（authed グループ、middleware.Auth + RateLimit("api",120,1分,PerUser)）。/api/users/me は routes_ext.go:117-119（RegisterExtraRoutes 内で NewUserProfileHandler(NewUserProfileUsecase(userRepo)) を組み立て）。共通ミドルウェアは Authorization: Bearer の JWT 検証と、プロセス内メモリのレート制限（キー "api:<userId>"、120req/分。全 authed ルート共通カウンタ、複数インスタンスでは効かない）。

【エラー→HTTP対応 (pkg/response/response.go HandleDomainError)】NotFoundError→404 / ConflictError→409 / ValidationError→400 / ForbiddenError→403 / その他→500 "サーバーエラーが発生しました"。成功は Success=200、Created=201。エラーボディは {success:false, error:"<日本語メッセージ>"}。認証失敗は 401 {success:false,error:"認証エラー"}、レート超過は 429。

【Java へ移すべきドメイン規則（単なる CRUD ではない部分）】
1. memberType の既定値補完（空文字→"human"）は MemberUsecase.Create にあるアプリ側規則（DB の DEFAULT には到達しない。GORM が空文字を明示 INSERT するため）。
2. メンバー所有権チェック（ensureOwner / ensureMemberOwner）。「無ければ 404 メンバーが見つかりません、他人なら 403 このメンバーにアクセスする権限がありません」というメッセージとステータスの使い分けが契約になっている。
3. /members/summary の集計規則（medicationCount = 紐づく薬の総数、activeMedicationCount = isActive=true の数、status 列は無視）。
4. メンバー削除の波及範囲（FK CASCADE 依存）。
5. これ以外（name/petType/notes/birthDate の更新、users/me の3項目更新）は実質 CRUD で、ビジネス検証は入っていない。

【Go 側の不具合・危うい実装（移植時に踏襲しないほうがよい／要判断）】
A. PATCH /api/members/{memberId} の name に検証が無い。POST では binding:"required,max=100" なのに、更新では空文字も100文字超も通る。DB は NOT NULL だが空文字は通過するので、名前が空のメンバーを作れてしまう。Java 側では更新にも同じ @NotBlank @Size(max=100) を掛けるべき（挙動が変わる点は要合意）。
B. parseDate（handler/helpers.go:6）が不正な日付文字列を **エラーにせず nil** にする。POST では「birthDate 未指定」、PATCH では「変更なし」として 200 が返り、クライアントは更新されたと誤認する。Java では 400 を返すか、少なくとも仕様として明記が必要。
C. PATCH 系で null に戻せない（nil ポインタ＝未変更のため）。birthDate / notes / petType / displayName / characterName を明示的に NULL クリアする手段が API に存在しない。
D. UserProfileUsecase.Update + UserRepository.Update(user_repository.go:97-115) が **全列上書きの read-modify-write**。トランザクションも楽観ロックも無いので、プロフィール更新とパスワードリセット／メール検証／Google 連携が同時に走ると、後着の UPDATE が読み取り時点の古い password・resetCode・emailVerified・googleId で上書きして変更を消す（lost update）。Java では変更した列だけを UPDATE するか、@Version 等で保護すべき。最重要の移植時要修正点。
E. PATCH /api/users/me のレスポンス updatedAt が古い値を返す（DB は now() を書くが返す entity を更新していない）。member 側は再取得しているので整合が取れていない。
F. MemberRepository の UPDATE / DELETE が WHERE "id"=? のみで "userId" を含まない。所有権は usecase の事前 SELECT だけで担保しており、SELECT と UPDATE/DELETE が同一トランザクションでない（TOCTOU）。Java では WHERE id=? AND userId=? にして更新行数 0 を 404/403 として扱うのが安全。
G. MemberRepository.Update は UPDATE 後に FindByID で再取得するが、その間に行が消えると (nil, nil) を返し、ハンドラは 200 かつ data:null を返す（success:true のまま）。契約上 data が null になりうる。
H. /members/summary の LEFT JOIN が med."userId" を条件に含まない。また Medication."userId" には User への FK が無く、Medication."memberId" と "userId" の整合を保証する制約も無い。同様に GET /members/{id}/medications と /records も SQL は memberId のみで絞る（所有権はメンバー単位でしか確認しない）ため、userId がずれたデータがあると他ユーザー userId の行が混ざる。Java 側では userId も AND 条件に入れるのが安全。
I. GET /members/{id}/records に上限・期間フィルタ・ページングが無く、takenAt DESC で全件返す。服薬記録は際限なく増えるので、そのまま移植するとレスポンス肥大化の恐れ。
J. POST /api/members のバインドエラーが原因を問わず 400 "名前は必須です" になる（100文字超も JSON 不正も同じ文言）。エラーメッセージを契約として保つか、Java の bean validation で正確な文言にするかは要判断。
K. characterType に列挙検証が無く、"" を NOT NULL DEFAULT 'cat' の列に書き込める。既存 Java 実装が enum 化するなら、既存データの想定外値を読めるようにする必要がある。
L. photoUrl は Go の API から一切書き込めない（読み出し専用。DB 列と entity にはあるが Create/Update 入力に無い）。一方 backend-java の MemberController.RegisterRequest は photoUrl を受け取っており、既に契約がズレている（要すり合わせ）。同じく Java 側の RegisterRequest は memberType が @NotBlank だが、Go は省略可（"human" 補完）で、birthDate も Java は LocalDate、Go は RFC3339/日時形式も受け付ける点が違う。
M. DashboardPreference."defaultMemberId" は FK が無いため、メンバー削除後に宙ぶらりんの ID が残る。
N. 403/404 の使い分けにより、他人のメンバーID の存在有無が判別できる（列挙可能）。仕様として維持するか 404 に統一するかは要判断。
O. ルート順序: /members/summary が /members/:memberId より先に登録されている（gin v1.10 では静的パス優先で解決）。Spring でも静的パスが優先されるので通常問題ないが、{memberId} に "summary" が流れ込まないことを確認すること。
P. ID はアプリ生成の UUID v4（pkg/auth/id.go）。DB の id 列は TEXT で、Prisma 時代の cuid と UUID が混在しうるため、Java 側で UUID 型にしないこと。

### GET /api/members

**レスポンス**: data = Member[] （空なら []）。Member = { id: string(UUID v4またはcuid), userId: string, memberType: string, name: string, petType: string|null, photoUrl: string|null, birthDate: string(RFC3339)|null, notes: string|null, createdAt: string(RFC3339), updatedAt: string(RFC3339) }。password等の秘匿列は無い。

**ステータス**: 200 成功 / 401 認証エラー(Bearer欠落・検証失敗、body: {success:false,error:"認証エラー"}) / 429 "リクエストが多すぎます。しばらくしてから再試行してください。" / 500 "サーバーエラーが発生しました"

**所有権**: JWT の sub (middleware.UserID) を WHERE "userId" に直接使う。リクエストから userId は受け取らない。

**ドメイン規則**: 単純な一覧取得。SQL: SELECT ... FROM "Member" WHERE "userId"=$1 ORDER BY "createdAt" ASC（sqlc: ListMembers）。ページングなし。Go側は make([]entity.Member,0,...) なので 0件でも null ではなく [] を返す。

### GET /api/members/summary

**レスポンス**: data = MemberSummary[] （空なら []）。MemberSummary は Member を埋め込み展開したフラットなJSON + { medicationCount: number, activeMedicationCount: number }。つまり { id, userId, memberType, name, petType, photoUrl, birthDate, notes, createdAt, updatedAt, medicationCount, activeMedicationCount }。

**ステータス**: 200 / 401 / 429 / 500（メッセージは他エンドポイントと同一）

**所有権**: Member 側のみ m."userId" = JWT sub で絞る。Medication は memberId でのみ結合。

**ドメイン規則**: N+1回避のための集計読み取りモデル。生SQL(aggregate_queries.go ListSummary): SELECT m.* , COUNT(med."id") AS medication_count, COUNT(med."id") FILTER (WHERE med."isActive") AS active_count FROM "Member" m LEFT JOIN "Medication" med ON med."memberId" = m."id" WHERE m."userId"=$1 GROUP BY m."id" ORDER BY m."createdAt" ASC。activeMedicationCount は "isActive" 列のみで判定し、"status" 列（active/paused/stopped）は見ない。JOIN 条件に med."userId" は含まれない。

### POST /api/members

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `name` | string | ○ | binding:"required,max=100"（空文字不可、ルーン数100以下）。DB列 "name" は TEXT NOT NULL |
| `memberType` | string | — | 検証なし。空文字ならユースケースで "human" を代入。任意の文字列を保存可能（human/pet の列挙チェックは無い）。DB列は TEXT NOT NULL DEFAULT 'human' |
| `petType` | string|null | — | 検証なし。memberType との整合チェックも無い。DB列は TEXT NULL |
| `birthDate` | string|null | — | handler/helpers.go parseDate で RFC3339 / "2006-01-02T15:04:05" / "2006-01-02" の順に試行。どれにも合わなければ **エラーにせず nil**（未指定と同じ）。DB列は TIMESTAMPTZ NULL |
| `notes` | string|null | — | 検証なし。長さ制限なし。DB列は TEXT NULL |

**レスポンス**: data = 作成された Member（INSERT 後に FindByID で再取得した値）。photoUrl は常に null（APIから設定不可）。id はアプリ生成の UUID v4 (auth.NewID)。memberType は未指定なら "human"。createdAt/updatedAt は DB の DEFAULT now()。

**ステータス**: 201 Created（response.Created） / 400 バインド失敗時は原因を問わず "名前は必須です"（100文字超・JSON不正でも同じ文言） / 401 / 429 / 500

**所有権**: CreateMemberInput.UserID に JWT sub を必ず設定するため、他人の配下にメンバーを作る経路は無い。

**ドメイン規則**: MemberUsecase.Create は memberType が空文字なら "human" を補完するだけ。それ以外のビジネス検証・重複チェック・件数上限は一切なし。INSERT は GORM の Create（gormMember）。userId はリクエストから受け取らず JWT sub。photoUrl はモデルに列はあるが Create/Update いずれの入力にも無い。

### GET /api/members/{memberId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string (パスパラメータ) | ○ | 形式検証なし。存在しなければ 404 |

**レスポンス**: data = Member（単体オブジェクト）

**ステータス**: 200 / 404 "メンバーが見つかりません"（domain.NewNotFound("メンバー")） / 403 "このメンバーにアクセスする権限がありません"（domain.NewForbidden） / 401 / 429 / 500

**所有権**: FindByID(memberId) → nil なら 404、m.UserID != JWT sub なら 403。存在有無と権限違反でステータスが分かれるため、他人のメンバーIDの存在有無が 403/404 の差で漏れる（列挙可能）。

**ドメイン規則**: MemberUsecase.Get = ensureOwner のみ。SQL は SELECT ... FROM "Member" WHERE "id"=$1（userId 条件なし）で取得後、Go 側で userId を比較する。

### PATCH /api/members/{memberId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string (パスパラメータ) | ○ | 存在しなければ 404、他人のものなら 403 |
| `name` | string|null (ポインタ) | — | **binding タグなし＝検証なし**。空文字も100文字超も通る（作成時の required,max=100 が効かない）。null/未指定は「変更なし」 |
| `petType` | string|null | — | 検証なし。null/未指定は変更なし。NULL に戻す手段は無い（空文字なら "" が入る） |
| `birthDate` | string|null | — | parseDate で解析。解析失敗・空文字・null はすべて nil＝変更なし扱い（エラーにならない）。NULL に戻す手段は無い |
| `notes` | string|null | — | 検証なし。null/未指定は変更なし。NULL に戻す手段は無い |

**レスポンス**: data = 更新後の Member（UPDATE 後に FindByID で再取得。updatedAt は now() で更新済みの新しい値）。稀に data: null になりうる（下記 notes 参照）。

**ステータス**: 200 / 400 "入力内容が正しくありません"（JSONバインド失敗時。body 空も EOF で 400） / 404 "メンバーが見つかりません" / 403 "このメンバーにアクセスする権限がありません" / 401 / 429 / 500

**所有権**: 先に ensureOwner（FindByID → userId 比較）。その後の UPDATE は WHERE "id" = ? のみで "userId" 条件を含まない。SELECT と UPDATE が別トランザクションのため TOCTOU の隙間がある。

**ドメイン規則**: memberType と photoUrl は更新不可（入力構造体に存在しない）。UPDATE は GORM の map ベースで、送られたフィールドだけ SET し、加えて必ず "updatedAt"=now() を SET する（空ボディ {} でも updatedAt だけ更新されて 200）。ビジネス検証は無く実質 CRUD。

### DELETE /api/members/{memberId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string (パスパラメータ) | ○ | 存在しなければ 404、他人のものなら 403 |

**レスポンス**: data = { ok: true } （200。204 ではない）

**ステータス**: 200 / 404 "メンバーが見つかりません" / 403 "このメンバーにアクセスする権限がありません" / 401 / 429 / 500

**所有権**: ensureOwner の後に DELETE。DELETE 文自体は WHERE "id"=? のみで "userId" を含まない。

**ドメイン規則**: アプリ側は "Member" の1行 DELETE のみ（WHERE "id"=?）。関連データの削除は完全に DB の FK ON DELETE CASCADE 任せ: Medication, MedicationRecord, HealthLog, Appointment, Vaccination, Examination, Insurance, Allergy, BodyMeasurement, TemperatureRecord, EmergencyContact, Prescription が連鎖削除。Schedule は memberId に FK が無いが medicationId 経由で連鎖削除される。Expense."memberId" は ON DELETE SET NULL。DashboardPreference."defaultMemberId" は FK が無いため削除済みIDが残る。明示的なトランザクションは張っていない。

### GET /api/members/{memberId}/medications

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string (パスパラメータ) | ○ | 存在しなければ 404、他人のものなら 403 |

**レスポンス**: data = Medication[]（空なら []）。Medication = { id, memberId, userId, name, category, dosageAmount: string|null, frequency: string|null, stockQuantity: number|null, stockAlertDate: string|null, intervalHours: number|null, instructions: string|null, displayOrder: number, isActive: boolean, status: string, createdAt, updatedAt }

**ステータス**: 200 / 404 "メンバーが見つかりません" / 403 "このメンバーにアクセスする権限がありません" / 401 / 429 / 500

**所有権**: usecase/ownership_ext.go ensureMemberOwner（メンバーを FindByID → 無ければ 404 / userId 不一致なら 403）。薬側の userId は再確認しない。

**ドメイン規則**: MedicationUsecase.ListByMember。SQL: WHERE "memberId"=$1 ORDER BY "displayOrder" ASC, "createdAt" ASC（sqlc: ListMedicationsByMember）。userId 条件は無い。ページングなし。isActive/status によるフィルタもなし（休薬・中止も全部返る）。

### GET /api/members/{memberId}/records

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string (パスパラメータ) | ○ | 存在しなければ 404、他人のものなら 403 |

**レスポンス**: data = MedicationRecord[]（空なら []）。MedicationRecord = { id, memberId, medicationId, userId, scheduleId: string|null, takenAt: string(RFC3339), notes: string|null, dosageAmount: string|null }

**ステータス**: 200 / 404 "メンバーが見つかりません" / 403 "このメンバーにアクセスする権限がありません" / 401 / 429 / 500

**所有権**: ensureMemberOwner のみ（メンバー所有権）。記録行の userId は照合しない。

**ドメイン規則**: RecordUsecase.ListByMember。SQL: WHERE "memberId"=$1 ORDER BY "takenAt" DESC（sqlc: ListMedicationRecordsByMember）。件数上限・期間フィルタ・ページングが一切なく全件返す。userId 条件は無い。

### GET /api/users/me

**レスポンス**: data = User = { id: string, email: string, displayName: string|null, characterType: string, characterName: string|null, emailVerified: boolean, createdAt: string(RFC3339), updatedAt: string(RFC3339) }。password / verificationCode / verificationExpiry / verificationAttempts / resetCode / resetCodeExpiry / googleId は json:"-" で常に非公開。

**ステータス**: 200 / 404 "ユーザーが見つかりません"（JWT は有効だが User 行が無い＝アカウント削除後など） / 401 / 429 / 500

**所有権**: JWT sub をそのまま主キーに使うため他人のプロフィールを取得する経路は無い（userId をリクエストで受け取らない）。

**ドメイン規則**: UserProfileUsecase.Get。SQL: SELECT ... FROM "User" WHERE "id"=$1（sqlc: GetUserByID）。単純な自分自身の取得。

### PATCH /api/users/me

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `displayName` | string|null (ポインタ) | — | 検証なし（長さ制限なし）。null/未指定は変更なし。DB列 TEXT NULL。JSON null で NULL に戻すことはできない |
| `characterType` | string|null (ポインタ) | — | **列挙検証なし**。非nilならデリファレンスして代入するので空文字も保存される。DB列は TEXT NOT NULL DEFAULT 'cat' |
| `characterName` | string|null (ポインタ) | — | 検証なし（長さ制限なし）。DB列 TEXT NULL |

**レスポンス**: data = 更新後の User（メモリ上で書き換えた entity をそのまま返す。DB からの再取得はしない）。そのため **updatedAt は更新前の古い値**（DB 側は now() に更新されている）。

**ステータス**: 200 / 400 "入力内容が正しくありません"（JSONバインド失敗） / 404 "ユーザーが見つかりません" / 401 / 429 / 500

**所有権**: 対象は常に JWT sub のユーザー自身。userId をリクエストで受け取らないため他人の更新経路は無い。

**ドメイン規則**: FindByID → 非nilフィールドだけメモリ上で反映 → UserRepository.Update。Update は GORM の map で **email/password/displayName/characterType/characterName/emailVerified/verificationCode/verificationExpiry/verificationAttempts/resetCode/resetCodeExpiry/googleId/updatedAt=now() の全列を無条件に上書き**する（WHERE "id"=?）。トランザクション・楽観ロックなし。email や password をこのエンドポイントから変更する入口は無い（読み取った値をそのまま書き戻すだけ）。

## misc-crud (allergies / insurances / emergency-contacts / notification-settings / dashboard-preferences)

### 移植時の注意

【ルート登録の所在】
- /api/allergies/*, /api/insurances/*, /api/emergency-contacts/*, /api/notification-settings は /Users/takuma.kawano/HealthFamily/backend/internal/interface/router/routes_ext.go の RegisterExtraRoutes で登録（行 61-74, 94-99, 112-114）。
- /api/dashboard-preferences は /Users/takuma.kawano/HealthFamily/backend/internal/interface/router/router.go の行 113-114 で直接登録。
- 全て api.Group("") + middleware.Auth(tm) + middleware.RateLimit("api", 120, 1分, PerUser) の配下。パスプレフィックスは /api。

【共通のレスポンス／エラー契約】
- 成功: 200 = {"success":true,"data":...}、201 = 同形式（POST の Create のみ）。
- エラー: {"success":false,"error":"<日本語メッセージ>"}。pkg/response/response.go の HandleDomainError のマッピングは NotFoundError→404, ConflictError→409, ValidationError→400, ForbiddenError→403, それ以外→500 かつ固定文言 "サーバーエラーが発生しました"（原因は c.Error() に積むだけでクライアントには出さない）。misc-crud の経路では ConflictError / ValidationError は一切生成されない（400 はハンドラの ShouldBindJSON 失敗のみ）。
- 認証失敗は middleware.Auth が 401 {"success":false,"error":"認証エラー"}。Authorization ヘッダが無い、または "Bearer " プレフィックスが無い時点で 401。
- レート超過は 429 {"success":false,"error":"リクエストが多すぎます。しばらくしてから再試行してください。"}。インメモリ（プロセスローカル）実装なので Cloud Run の複数インスタンスでは実質インスタンス毎カウント。Java 移植では分散カウンタにするか、この差異を許容するか要判断。
- 一覧は必ず make([]T, 0, n) で作るため空でも null ではなく [] を返す。Java でも空配列を返すこと。

【Java に移すべきドメイン規則（単なる CRUD ではない部分）】
1. MemberScopedCRUD（internal/usecase/crud.go）の 4 つの規則。allergies / insurances / emergency-contacts は完全にこれに乗っている:
   - Create: ensureMemberOwner で memberId の存在（無ければ 404 "メンバーが見つかりません"）と所有（他人のものなら 403 "このメンバーにアクセスする権限がありません"）を検証してから INSERT。
   - Get/Update/Delete: FindByID → nil なら 404 "<リソース名>が見つかりません"、entity.userId != JWT userId なら 403 "<個別文言>"。
   - 保存する userId は必ず JWT 由来。リクエストボディの userId は受け付けない（そもそもフィールドが無い）。
   - memberId は作成時のみ指定可、更新では変更不可。
2. PATCH の「nil＝未指定はスキップ」部分更新セマンティクス。更新対象が 0 件のときは SQL を発行せず現在値を 200 で返す。
3. notification-settings の「行が無ければ既定値 (true×5, 5, 1) を返す」フォールバックと、PUT の「INSERT 時は既定値で穴埋め、UPDATE 時は指定項目のみ更新」ハイブリッド UPSERT。
4. dashboard-preferences の「行が無ければ hiddenCards=[]、cardOrder=[]、defaultMemberId=null を返す」フォールバックと、defaultMemberId の空文字→null 正規化。
5. それ以外（列マッピング、createdAt DESC の並び、UUIDv4 採番）は単なる CRUD。

【Go 側の不具合・危うい実装（Java 移植で修正 or 意図的に踏襲を判断すべき点）】
A. dashboard-preferences PUT が「未指定フィールドを既存値で消す」破壊的挙動。hiddenCards / cardOrder が *[]string ではなく []string のため、JSON に含めなければ nil → repository で [] に変換 → ON CONFLICT で EXCLUDED（=空配列）に上書きされる。defaultMemberId も未指定なら NULL 上書き。つまり {"hiddenCards":["a"]} だけ送ると cardOrder と defaultMemberId が消える。同じ PUT でも notification-settings は「未指定は維持」で、2 エンドポイントのセマンティクスが不一致。
B. dashboard-preferences の defaultMemberId に所有権チェックが無い。usecase は空文字を nil にするだけで、members リポジトリを一切参照していない。DB 側も migrations/0004_budget_personalization.sql の "defaultMemberId" TEXT に REFERENCES が無く FK 制約すら無い。他人の memberId や存在しない ID をそのまま保存できる。Java 側では Member の所有権検証を追加すべき。
C. 403 と 404 を区別するため、他人のリソース ID を指定すると 403 が返り「その ID が存在すること」が漏れる（ID 列挙で他ユーザーの資源存在を判定可能）。UUIDv4 なので実害は小さいが、Java では 404 に寄せる選択もあり得る。
D. UPDATE / DELETE の SQL が WHERE "id" = ? のみで userId 条件を持たない（allergy_repository.go:106,114、insurance_repository.go:96,104、emergency_contact_repository.go:96,104）。所有権はアプリ層の事前チェック 1 箇所だけに依存している。Java 移植でこの事前チェックを落とすと即クロステナント書き込み。UPDATE/DELETE の WHERE にも userId を入れる二重防御が望ましい。
E. Create の所有権チェックと INSERT が同一トランザクションでない（crud.go:60-65）。ensureMemberOwner 直後に member が削除されると FK 違反で 500 になる（データ破壊は起きないが 500 が漏れる）。同様に notification/dashboard の Upsert も「書き込み → 別クエリで読み直し」の 2 発で、トランザクション外。
F. parseDate（handler/helpers.go）が解釈できない日付文字列を エラーにせず nil にする。POST /api/allergies に "diagnosedAt":"2026-13-99" を送ると 400 にならず diagnosedAt=NULL で 201 が返る。PATCH では「無視して 200」になる。Java では 400 を返すのが正しい。
G. nullable 列を NULL に戻す手段が無い。PATCH で "notes":null を送っても nil 判定でスキップされるだけ。"" を送れば空文字が入る（NULL ではない）。allergies の diagnosedAt も一度入れたら消せない。Java 移植で JSON の明示的 null と未指定を区別する設計（JsonNullable 等）にするか、Go の挙動を踏襲するか要決定。
H. 必須 string に対する binding:"required" は Go の validator 仕様で空文字を弾くが、PATCH 側は空文字チェックが無いため、NOT NULL 列（allergenName / allergyType / severity / insuranceType / contactName / phoneNumber）に空文字を後から入れられる。作成時と更新時で不変条件が食い違っている。
I. allergyType / severity / insuranceType / relationship に列挙値の検証が一切なく、任意文字列が保存される。phoneNumber も形式検証ゼロ。DB 側も CHECK 制約なし。
J. notification-settings の defaultReminderMinutesBefore / defaultAppointmentReminderDaysBefore に範囲検証が無く、負値や極端な値を保存できる。
K. notification-settings GET が未作成時に id="" / createdAt=updatedAt="0001-01-01T00:00:00Z"（Go の time.Time ゼロ値）を返す。クライアントから見ると「id が空文字で 1 年生の日付」という不正なオブジェクト。Java の LocalDateTime/Instant で同じ値を再現するのは不自然なので、null を返すか GET 時に行を作るかを設計判断すべき。
L. notification-settings / dashboard-preferences の Upsert は毎回 UUIDv4 を新規採番して INSERT を試みる。ON CONFLICT で既存 id が保持されるため実害はないが、id 採番が無駄。
M. 未使用の一貫性欠如: notification-settings と dashboard-preferences は新規作成でも 200 を返す（他リソースの POST は 201）。REST 的には PUT なので 200 でも許容範囲だが、Java 側でステータスを揃えるなら破壊的変更になる。
N. 一覧 API にページング・memberId フィルタ・件数上限が無い。件数が増えると全件返す。
O. 本番 DB は旧 Prisma 由来のため migrations/0007, 0008 のような後付け ALTER に依存している（CREATE TABLE IF NOT EXISTS が no-op になる問題）。Java 側で Flyway/Liquibase に移す際は、実 DB のスキーマを直接確認してからベースラインを切ること。
P. insurances の policyNumber（保険証番号）が平文保存・平文返却でマスキング無し。ログ出力の有無は未確認だが、Java 移植時に暗号化やレスポンスマスキングを検討する価値がある。

【確認できなかった／対象外】
- Next.js フロントエンド側（/Users/takuma.kawano/HealthFamily/src）にこれら 5 リソースを呼ぶコードは grep で見つからなかった（"dashboard-preferences" / "notification-settings" ともにヒット 0）。既存クライアントの期待値による制約は確認できていない。
- これら 5 リソースの handler / repository に対する Go のユニットテストは存在せず、usecase/crud_test.go（MemberScopedCRUD の 404/403/成功パス）と router_smoke_test.go（ルート登録が panic しないこと）のみ。振る舞いの回帰テストは Java 側で新規に書く必要がある。

### GET /api/allergies

**レスポンス**: data = Allergy[]（空でも null ではなく []）。Allergy = { id: string(UUIDv4), userId: string, memberId: string, allergenName: string, allergyType: string, severity: string, symptoms: string|null, diagnosedAt: string(RFC3339)|null, notes: string|null, createdAt: string(RFC3339) }。並び順は createdAt DESC (sqlc ListAllergies)。

**ステータス**: 200 成功 / 401 認証エラー(トークン無し・不正, error="認証エラー") / 429 レート制限(error="リクエストが多すぎます。しばらくしてから再試行してください。") / 500 "サーバーエラーが発生しました"

**所有権**: SQL の WHERE "userId" = $1 で JWT の userID に絞り込み。memberId によるフィルタは無い（クエリパラメータ非対応）。

**ドメイン規則**: 単純な一覧取得。ページングもフィルタも無し。usecase は repo.List をそのまま返すのみ。

### GET /api/allergies/:allergyId

**レスポンス**: data = Allergy（上記オブジェクト単体）

**ステータス**: 200 / 401 / 403 "このアレルギー情報にアクセスする権限がありません" / 404 "アレルギーが見つかりません" / 429 / 500

**所有権**: MemberScopedCRUD.ensureOwner: repo.FindByID(id) は userId 条件なしで単一行取得 → nil なら 404、entity.UserID != JWT userID なら 403。所有権はアプリ層でのみ担保（SQL には userId 条件が無い）。

**ドメイン規則**: 取得のみ。副作用なし。

### POST /api/allergies

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required"（空文字は不可） |
| `allergenName` | string | ○ | binding:"required"（空文字は不可）。長さ・文字種の検証なし |
| `allergyType` | string | ○ | binding:"required"。列挙値の検証は一切なし（任意文字列を保存） |
| `severity` | string | ○ | binding:"required"。列挙値の検証は一切なし（任意文字列を保存） |
| `symptoms` | string|null | — | 検証なし。null/未指定なら DB も NULL |
| `diagnosedAt` | string|null | — | parseDate() が RFC3339 / "2006-01-02T15:04:05" / "2006-01-02" の順で試行。どれにも一致しなければエラーにせず nil（=NULL 保存） |
| `notes` | string|null | — | 検証なし |

**レスポンス**: data = Allergy（DB INSERT 後に FindByID で読み直した完全な行。createdAt は DB の now()）

**ステータス**: 201 成功 / 400 バインド失敗（固定文言 "メンバーID・アレルゲン名・種別・重症度は必須です"。どのフィールドが原因かは返さない） / 401 / 403 "このメンバーにアクセスする権限がありません" / 404 "メンバーが見つかりません" / 429 / 500

**所有権**: MemberScopedCRUD.Create → ensureMemberOwner(members.FindByID(memberId))。member が nil なら NotFound("メンバー")=404、member.UserID != JWT userID なら Forbidden=403。保存される userId は必ず JWT 由来でリクエストボディからは受け取らない。

**ドメイン規則**: id は UUIDv4 をアプリ側で採番（auth.NewID）。createdAt は DB DEFAULT now()。所有権チェックと INSERT は同一トランザクションではない（TOCTOU）。DB 側 NOT NULL: userId, memberId, allergenName, allergyType, severity, createdAt。userId/memberId は User/Member への FK（ON DELETE CASCADE）。

### PATCH /api/allergies/:allergyId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `allergenName` | string|null | — | 非 null のときのみ更新対象。空文字も許容（NOT NULL 列に "" が入る） |
| `allergyType` | string|null | — | 同上 |
| `severity` | string|null | — | 同上 |
| `symptoms` | string|null | — | 非 null のときのみ更新。null 送信では NULL に戻せない |
| `diagnosedAt` | string|null | — | parseDate で解釈できた場合のみ更新。解釈不能なら黙って無視（400 にならない）。NULL に戻す手段なし |
| `notes` | string|null | — | 非 null のときのみ更新。NULL に戻す手段なし |

**レスポンス**: data = Allergy（UPDATE 後に FindByID で再取得した行）

**ステータス**: 200 / 400 "入力内容が正しくありません"（JSON 不正・空ボディ等） / 401 / 403 "このアレルギー情報にアクセスする権限がありません" / 404 "アレルギーが見つかりません" / 429 / 500

**所有権**: ensureOwner で先に 404/403 判定してから repo.Update。UPDATE 文自体は WHERE "id" = ? のみで userId 条件が無い。

**ドメイン規則**: 部分更新（Go の nil ポインタ＝未指定）。更新対象フィールドが 0 件なら SQL を発行せず現在値を 200 で返す（{} で PATCH は no-op 成功）。memberId は更新不可（Update 入力に存在しない）。updatedAt 列は Allergy テーブルに存在しない。

### DELETE /api/allergies/:allergyId

**レスポンス**: data = { ok: true }（削除した行は返さない）

**ステータス**: 200 / 401 / 403 "このアレルギー情報にアクセスする権限がありません" / 404 "アレルギーが見つかりません" / 429 / 500

**所有権**: ensureOwner で 404/403 判定後に repo.Delete。DELETE 文は WHERE "id" = ? のみ。

**ドメイン規則**: 物理削除（論理削除フラグなし）。カスケード対象の子テーブルなし。

### GET /api/insurances

**レスポンス**: data = Insurance[]（空なら []）。Insurance = { id: string(UUIDv4), userId: string, memberId: string, insuranceType: string, providerName: string|null, policyNumber: string|null, notes: string|null, createdAt: string(RFC3339) }。createdAt DESC 順。

**ステータス**: 200 / 401 / 429 / 500

**所有権**: WHERE "userId" = $1 で JWT userID に絞り込み。

**ドメイン規則**: 単純 CRUD の一覧。フィルタ・ページングなし。policyNumber（保険証番号）を平文で保存・返却しており、マスキングや暗号化は一切していない。

### GET /api/insurances/:insuranceId

**レスポンス**: data = Insurance

**ステータス**: 200 / 401 / 403 "この保険にアクセスする権限がありません" / 404 "保険が見つかりません" / 429 / 500

**所有権**: ensureOwner（FindByID → nil で 404、UserID 不一致で 403）。SQL は id のみで検索。

**ドメイン規則**: 取得のみ。

### POST /api/insurances

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required" |
| `insuranceType` | string | ○ | binding:"required"。列挙値検証なし（任意文字列） |
| `providerName` | string|null | — | 検証なし |
| `policyNumber` | string|null | — | 検証なし（形式チェック・桁数チェックなし） |
| `notes` | string|null | — | 検証なし |

**レスポンス**: data = Insurance（INSERT 後に再取得）

**ステータス**: 201 / 400 "メンバーIDと保険種別は必須です" / 401 / 403 "このメンバーにアクセスする権限がありません" / 404 "メンバーが見つかりません" / 429 / 500

**所有権**: ensureMemberOwner（member 不在 404 / 他人の member 403）。userId は JWT 由来。

**ドメイン規則**: id は UUIDv4 採番、createdAt は DB now()。1 メンバーにつき複数保険を登録可（UNIQUE 制約なし）。NOT NULL: userId, memberId, insuranceType, createdAt。

### PATCH /api/insurances/:insuranceId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `insuranceType` | string|null | — | 非 null のときのみ更新。空文字も通る |
| `providerName` | string|null | — | 非 null のときのみ更新。NULL には戻せない |
| `policyNumber` | string|null | — | 同上 |
| `notes` | string|null | — | 同上 |

**レスポンス**: data = Insurance（UPDATE 後に再取得）

**ステータス**: 200 / 400 "入力内容が正しくありません" / 401 / 403 "この保険にアクセスする権限がありません" / 404 "保険が見つかりません" / 429 / 500

**所有権**: ensureOwner 後に UPDATE。UPDATE の WHERE は id のみ。

**ドメイン規則**: 部分更新。0 件なら SQL 未発行で現在値を返す。memberId は変更不可。

### DELETE /api/insurances/:insuranceId

**レスポンス**: data = { ok: true }

**ステータス**: 200 / 401 / 403 "この保険にアクセスする権限がありません" / 404 "保険が見つかりません" / 429 / 500

**所有権**: ensureOwner 後に DELETE（WHERE id のみ）。

**ドメイン規則**: 物理削除。

### GET /api/emergency-contacts

**レスポンス**: data = EmergencyContact[]（空なら []）。EmergencyContact = { id: string(UUIDv4), userId: string, memberId: string, contactName: string, phoneNumber: string, relationship: string|null, notes: string|null, createdAt: string(RFC3339) }。createdAt DESC 順。

**ステータス**: 200 / 401 / 429 / 500

**所有権**: WHERE "userId" = $1。

**ドメイン規則**: 単純 CRUD。優先順位（priority）や既定連絡先の概念は無い。

### GET /api/emergency-contacts/:contactId

**レスポンス**: data = EmergencyContact

**ステータス**: 200 / 401 / 403 "この緊急連絡先にアクセスする権限がありません" / 404 "緊急連絡先が見つかりません" / 429 / 500

**所有権**: ensureOwner。SQL は id のみで検索。

**ドメイン規則**: 取得のみ。

### POST /api/emergency-contacts

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required" |
| `contactName` | string | ○ | binding:"required" |
| `phoneNumber` | string | ○ | binding:"required" のみ。電話番号の形式・桁数検証は一切なし |
| `relationship` | string|null | — | 検証なし |
| `notes` | string|null | — | 検証なし |

**レスポンス**: data = EmergencyContact（INSERT 後に再取得）

**ステータス**: 201 / 400 "メンバーID・連絡先名・電話番号は必須です" / 401 / 403 "このメンバーにアクセスする権限がありません" / 404 "メンバーが見つかりません" / 429 / 500

**所有権**: ensureMemberOwner。userId は JWT 由来。

**ドメイン規則**: id は UUIDv4、createdAt は DB now()。1 メンバーに複数登録可。NOT NULL: userId, memberId, contactName, phoneNumber, createdAt。

### PATCH /api/emergency-contacts/:contactId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `contactName` | string|null | — | 非 null のときのみ更新。空文字も通る |
| `phoneNumber` | string|null | — | 非 null のときのみ更新。形式検証なし。空文字も通る |
| `relationship` | string|null | — | 非 null のときのみ更新。NULL には戻せない |
| `notes` | string|null | — | 同上 |

**レスポンス**: data = EmergencyContact（UPDATE 後に再取得）

**ステータス**: 200 / 400 "入力内容が正しくありません" / 401 / 403 "この緊急連絡先にアクセスする権限がありません" / 404 "緊急連絡先が見つかりません" / 429 / 500

**所有権**: ensureOwner 後に UPDATE（WHERE id のみ）。

**ドメイン規則**: 部分更新。0 件なら SQL 未発行。memberId 変更不可。

### DELETE /api/emergency-contacts/:contactId

**レスポンス**: data = { ok: true }

**ステータス**: 200 / 401 / 403 "この緊急連絡先にアクセスする権限がありません" / 404 "緊急連絡先が見つかりません" / 429 / 500

**所有権**: ensureOwner 後に DELETE（WHERE id のみ）。

**ドメイン規則**: 物理削除。

### GET /api/notification-settings

**レスポンス**: data = NotificationSetting = { id: string, userId: string, medicationReminderEnabled: boolean, missedMedicationEnabled: boolean, appointmentReminderEnabled: boolean, lowStockAlertEnabled: boolean, defaultReminderMinutesBefore: number(int), defaultAppointmentReminderDaysBefore: number(int), emailNotificationEnabled: boolean, createdAt: string(RFC3339), updatedAt: string(RFC3339) }。行が無い場合は DB に書かずメモリ上の既定値を返す: 全 boolean=true, defaultReminderMinutesBefore=5, defaultAppointmentReminderDaysBefore=1, userId=JWT の userID, id=""(空文字), createdAt/updatedAt="0001-01-01T00:00:00Z"（Go の time.Time ゼロ値）。

**ステータス**: 200（未作成でも 404 にはならない） / 401 / 429 / 500

**所有権**: user スコープ。SELECT ... WHERE "userId" = $1 で JWT userID の 1 行のみ。memberId の概念なし。

**ドメイン規則**: 「未作成なら既定値を返す」フォールバックが usecase 側のドメイン規則（NotificationSettingUsecase.Get）。DB DEFAULT（TRUE/TRUE/TRUE/TRUE/5/1/TRUE）と同じ値をアプリ側にもハードコードして二重管理している。

### PUT /api/notification-settings

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `medicationReminderEnabled` | boolean|null | — | 検証なし。未指定=null は「INSERT 時は true、UPDATE 時は既存値維持」 |
| `missedMedicationEnabled` | boolean|null | — | 同上（INSERT 既定 true） |
| `appointmentReminderEnabled` | boolean|null | — | 同上（INSERT 既定 true） |
| `lowStockAlertEnabled` | boolean|null | — | 同上（INSERT 既定 true） |
| `defaultReminderMinutesBefore` | number(int)|null | — | 範囲検証が一切ない。負値・0・巨大値も通る。INSERT 既定 5 |
| `defaultAppointmentReminderDaysBefore` | number(int)|null | — | 範囲検証が一切ない。負値も通る。INSERT 既定 1 |
| `emailNotificationEnabled` | boolean|null | — | 同上（INSERT 既定 true） |

**レスポンス**: data = NotificationSetting（UPSERT 後に SELECT し直した DB の完全な行。id・createdAt・updatedAt が実値で入る）

**ステータス**: 200（新規作成時も 201 ではなく 200） / 400 "入力内容が正しくありません"（JSON 不正・空ボディ） / 401 / 429 / 500

**所有権**: userId は JWT からのみ設定。UPSERT の競合キーは "userId" の UNIQUE 制約。他ユーザー行に触れる経路なし。

**ドメイン規則**: INSERT ... ON CONFLICT ("userId") DO UPDATE。INSERT 時は未指定を既定値(true/true/true/true/5/1/true)で埋め、CONFLICT 時は「送られてきた項目だけ」を更新し未指定は既存値を維持（PUT だが実質 PATCH セマンティクス）。updatedAt は常に now() で更新。id は毎回 UUIDv4 を採番するが CONFLICT 時は既存 id が保持される。

### GET /api/dashboard-preferences

**レスポンス**: data = DashboardPreference = { userId: string, hiddenCards: string[], cardOrder: string[], defaultMemberId: string|null }。※ DB には id/createdAt/updatedAt 列があるが JSON には含まれない。行が無い場合は DB に書かず { userId: JWT userID, hiddenCards: [], cardOrder: [], defaultMemberId: null } を返す。

**ステータス**: 200（未作成でも 404 にはならない） / 401 / 429 / 500

**所有権**: user スコープ。SELECT ... WHERE "userId" = $1。

**ドメイン規則**: 未設定時の既定値（全カード表示・並び既定・既定メンバーなし）を usecase 側で生成する（DashboardPreferenceUsecase.Get）。カード ID の妥当性検証は無い。

### PUT /api/dashboard-preferences

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `hiddenCards` | string[] | — | ポインタでない []string のため未指定=nil。nil は repository 側で [] に変換され、既存値を空配列で上書きする（未指定＝維持ではない）。要素の値検証・重複排除・件数上限なし |
| `cardOrder` | string[] | — | 同上。未指定なら空配列で上書き。hiddenCards との整合性検証なし |
| `defaultMemberId` | string|null | — | 空文字 "" は usecase で nil に正規化される。それ以外は無検証でそのまま保存。未指定(null)なら NULL で上書き |

**レスポンス**: data = DashboardPreference（UPSERT 後に SELECT し直した行。{ userId, hiddenCards, cardOrder, defaultMemberId }）

**ステータス**: 200（新規作成時も 201 ではなく 200） / 400 "入力内容が正しくありません"（JSON 不正・空ボディ・型不一致） / 401 / 429 / 500

**所有権**: userId は JWT からのみ設定。ただし defaultMemberId の所有権チェックが無い（後述 notes 参照）。

**ドメイン規則**: INSERT ... ON CONFLICT ("userId") DO UPDATE SET hiddenCards/cardOrder/defaultMemberId = EXCLUDED.*（＝送信値で全置換）, updatedAt = now()。usecase 側の唯一のロジックは defaultMemberId の空文字→nil 正規化。id は毎回 UUIDv4 採番だが CONFLICT 時は既存 id が保持される。DB 列 hiddenCards/cardOrder は TEXT[] NOT NULL DEFAULT '{}'。

## prescription

### 移植時の注意

【共通仕様】
- 全エンドポイントが /api 配下・JWT Bearer 認証必須（middleware.Auth）。Authorization ヘッダ欠落/不正は 401 {"success":false,"error":"認証エラー"}。
- 認証済みグループ全体に RateLimit("api", 120回/分, ユーザ単位) が掛かる。超過時 429 {"success":false,"error":"リクエストが多すぎます。しばらくしてから再試行してください。"}。
- レスポンスは常に {success, data?, error?}。成功 200=Success / 201=Created、エラーは HandleDomainError が NotFound→404 / Conflict→409 / Validation→400 / Forbidden→403 / それ以外→500(固定文言 "サーバーエラーが発生しました") にマップ。Prescription 系で Conflict(409) を投げる経路は存在しない。
- ルート定義は router.go ではなく routes_ext.go の RegisterExtraRoutes 内（101-109行目）。パスパラメータ名は :prescriptionId。

【Java へ移すべきドメイン規則（単なる CRUD ではない部分）】
1. 所有権: Prescription は userId 直持ち。取得系は必ず「存在しない=404 / 他人=403」を区別する（Go は FindByID(id) で全件から引いてからメモリ上で userId 比較している）。
2. Create 時のみ Member 所有権も検証（member 不在=404「メンバーが見つかりません」、他人の member=403「このメンバーにアクセスする権限がありません」）。
3. 日付パースの3フォーマット許容（RFC3339 / yyyy-MM-dd'T'HH:mm:ss / yyyy-MM-dd）。prescribedAt だけがパース失敗で 400 になる。
4. PUT /items は「全置換」セマンティクス。sortOrder は配列順に 0 から採番。name 必須。
5. Dispense は明細→Medication 変換（category 固定 "regular"、dosage→dosageAmount、frequency→frequency）。明細0件なら 400。
6. Prescription 削除時の PrescriptionItem カスケード。

【Go 側の不具合・危うい実装（要修正検討）】
A. Dispense がトランザクション外。ループ途中で 1 件でも失敗すると、既に作成済みの Medication は残ったまま 500 が返る（部分適用）。
B. Dispense に冪等性・調剤済みフラグが無い。同じ処方箋に対して何度でも POST でき、そのたびに Medication が重複生成される。二重送信で薬が増える実害あり。Java 側では dispensedAt 列やユニーク制約の導入を検討すべき。
C. Dispense が明細の days を完全に無視（服薬日数が失われる）。stockQuantity も設定されないので在庫アラート機能に繋がらない。
D. PATCH で parseDate が失敗しても 400 にならず「未指定」として黙って捨てられる。クライアントが不正な日付を送ると "更新に成功したが値が変わっていない" 状態になる（Create は 400 を返すので挙動が非対称）。
E. PATCH / Create いずれもポインタ非 nil のみ更新するため、expiresAt / notes / electronicCode などを NULL に戻す手段が API として存在しない。
F. PATCH の prescriptionName に空文字チェックが無い。{"prescriptionName": ""} で NOT NULL 列に空文字が入り、Create の binding:"required" を迂回できる。
G. PUT /items でボディに items を含めない（あるいは {} を送る）だけで既存明細が全消去される。「未指定＝変更なし」ではなく「未指定＝全削除」なので事故りやすい。Java 側では items を必須にすることを推奨。
H. UPDATE / DELETE の SQL の WHERE 句が "id" = ? のみで、userId 条件が付いていない。現状は ensureOwner が唯一の防壁なので、ensureOwner の呼び忘れが即座に他人データ書き換えになる構造。Java では WHERE id = ? AND userId = ? を必ず付けるべき。
I. repository.FindByID(id) 自体は userId を条件に含まないため、リポジトリを直接使う新規コードから他人の処方箋を読める。
J. electronicCode（電子処方箋の引換番号/アクセスコード）を平文で保存し、List/Get のレスポンスにもマスクなしで含めている。機微情報の扱いとして要検討。migration 0005 で後付けされた NULL 許容列。
K. Dispense では Member の所有権を再検証していない（p.MemberID をそのまま Medication.memberId に書き込む）。Member 削除は Prescription を CASCADE で消すので現状は整合するが、依存関係は暗黙。
L. Prescription テーブルに updatedAt 列が無く、更新時刻を追跡できない（Medication には updatedAt がある）。エンティティ/レスポンスにも updatedAt は出ない。
M. prescribedAt と expiresAt の前後関係チェックが無い（expiresAt < prescribedAt を保存できる）。日付が未来かどうかの検証も無い。
N. List にページング・memberId フィルタ・期限切れフィルタが無く、ユーザの全処方箋＋全明細を毎回返す。
O. ReplaceItems 側の name=="" スキップは usecase 検証と重複しており、スキップが起きると sortOrder に欠番が生じる（現状 usecase が先に 400 を返すので到達しないデッドコード）。
P. ハンドラのバインドエラーはすべて固定文言に潰されており、どのフィールドが不正か分からない（Java 側で Bean Validation の詳細を返すなら、レスポンス文言が変わる点をフロントと合わせる必要あり）。

【DB 列と NOT NULL 制約】
- Prescription(migrations/0001_init.sql:225-238 + 0005): id TEXT PK / userId TEXT NOT NULL FK User ON DELETE CASCADE / memberId TEXT NOT NULL FK Member ON DELETE CASCADE / prescriptionName TEXT NOT NULL / prescribedBy TEXT / prescribedAt TIMESTAMPTZ NOT NULL / expiresAt TIMESTAMPTZ / pharmacyName TEXT / notes TEXT / createdAt TIMESTAMPTZ NOT NULL DEFAULT now() / electronicCode TEXT（0005 で追加、NULL 許容）。index: userId, memberId。
- PrescriptionItem(migrations/0006_prescription_items.sql): id TEXT PK / prescriptionId TEXT NOT NULL FK Prescription ON DELETE CASCADE / name TEXT NOT NULL / dosage TEXT / frequency TEXT / days INTEGER / sortOrder INTEGER NOT NULL DEFAULT 0 / createdAt TIMESTAMPTZ NOT NULL DEFAULT now()。index: prescriptionId。
- Medication(Dispense の書き込み先): category TEXT NOT NULL DEFAULT 'regular' / displayOrder INTEGER NOT NULL DEFAULT 0 / isActive BOOLEAN NOT NULL DEFAULT TRUE / status TEXT NOT NULL DEFAULT 'active' — Dispense はこれら既定値に委ねる。
- 実装の混在: 参照は sqlc(pgx)、書き込みは GORM、List は生 SQL(pgxpool) の3系統。Java 移植では単一の永続化層に統一してよい。

【参照ファイル（絶対パス）】
- /Users/takuma.kawano/HealthFamily/backend/internal/interface/router/routes_ext.go (101-109)
- /Users/takuma.kawano/HealthFamily/backend/internal/interface/handler/prescription_handler.go
- /Users/takuma.kawano/HealthFamily/backend/internal/interface/handler/helpers.go (parseDate)
- /Users/takuma.kawano/HealthFamily/backend/internal/usecase/prescription_usecase.go
- /Users/takuma.kawano/HealthFamily/backend/internal/usecase/ownership_ext.go (ensureMemberOwner)
- /Users/takuma.kawano/HealthFamily/backend/internal/domain/repository/repository_ext.go (288-319)
- /Users/takuma.kawano/HealthFamily/backend/internal/domain/entity/entities_ext.go (132-157)
- /Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/persistence/prescription_repository.go
- /Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/sqlc/sqlcgen/prescription.sql.go
- /Users/takuma.kawano/HealthFamily/backend/internal/pkg/response/response.go
- /Users/takuma.kawano/HealthFamily/backend/internal/domain/errors.go
- /Users/takuma.kawano/HealthFamily/backend/migrations/0001_init.sql, 0005_prescription_electronic_code.sql, 0006_prescription_items.sql

### GET /api/prescriptions

**レスポンス**: Prescription[]（常に配列。0件でも null ではなく []）。Prescription = { id: string, userId: string, memberId: string, prescriptionName: string, prescribedBy: string|null, prescribedAt: string(ISO8601 timestamptz), expiresAt: string|null, pharmacyName: string|null, electronicCode: string|null, notes: string|null, items: PrescriptionItem[], createdAt: string }。PrescriptionItem = { id: string, prescriptionId: string, name: string, dosage: string|null, frequency: string|null, days: number|null, sortOrder: number }。items も常に []（null にならない）。

**ステータス**: 200 成功 / 401 未認証("認証エラー") / 429 レート制限超過("リクエストが多すぎます。しばらくしてから再試行してください。") / 500 "サーバーエラーが発生しました"

**所有権**: SQL で WHERE "userId"=$1。JWT の userID のみで絞り込み、memberId フィルタやページングは無し。

**ドメイン規則**: 副作用なし。並び順は Prescription が "createdAt" DESC、items は "sortOrder", "createdAt" 昇順。明細は IN(ANY($1)) の1クエリでまとめ取得して各処方箋に割り当てる N+1 回避実装（Java 側でも fetch join / batch を推奨）。

### POST /api/prescriptions

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required"（空文字不可）。存在確認＋所有者確認あり。 |
| `prescriptionName` | string | ○ | binding:"required"（空文字不可）。長さ上限や文字種の検証は無し。DB は TEXT NOT NULL。 |
| `prescribedBy` | string|null | — | 検証なし。DB は TEXT NULL。 |
| `prescribedAt` | string (日付文字列) | ○ | binding:"required"（*string なので nil のみ弾く。空文字ポインタは通過し後段の日付パースで 400）。parseDate が RFC3339 / "2006-01-02T15:04:05" / "2006-01-02" の順で試行し、いずれも失敗なら 400。タイムゾーン無し形式は UTC 扱い。DB は TIMESTAMPTZ NOT NULL。 |
| `expiresAt` | string|null (日付文字列) | — | parseDate で同3形式。パース失敗時はエラーにならず nil（＝未指定）として無視される。prescribedAt との前後関係チェック無し。 |
| `pharmacyName` | string|null | — | 検証なし。 |
| `electronicCode` | string|null | — | 検証なし。電子処方箋の引換番号/アクセスコードを平文保存・平文返却。 |
| `notes` | string|null | — | 検証なし。 |

**レスポンス**: 作成された Prescription 1件（GET と同じ形）。items は作成直後なので常に []。id はアプリ生成 ID（auth.NewID()）、createdAt は DB の now() 既定値。

**ステータス**: 201 成功 / 400 バインド失敗 "メンバーID・名称・処方日は必須です" もしくは日付パース失敗 "処方日の形式が正しくありません" / 401 未認証 / 403 他人のメンバー指定 "このメンバーにアクセスする権限がありません" / 404 メンバー不存在 "メンバーが見つかりません" / 429 / 500

**所有権**: usecase.Create → ensureMemberOwner(members.FindByID(memberId))。member が nil なら 404、member.UserID != JWT userID なら 403。Prescription.userId には JWT の userID を必ずサーバ側で設定する（リクエストボディからは受け取らない）。

**ドメイン規則**: 検証は上記のみ。INSERT する列は id/userId/memberId/prescriptionName/prescribedBy/prescribedAt/expiresAt/pharmacyName/electronicCode/notes。createdAt は DB 既定値 now()。Prescription テーブルに updatedAt 列は存在しない。INSERT 後に FindByID で再読込して返す。

### GET /api/prescriptions/{prescriptionId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `prescriptionId` | string (path param, Gin では :prescriptionId) | ○ | 形式検証なし。 |

**レスポンス**: Prescription 1件（items 込み。items は sortOrder, createdAt 昇順、0件なら []）。

**ステータス**: 200 成功 / 401 未認証 / 403 他人の処方箋 "この処方箋にアクセスする権限がありません" / 404 不存在 "処方箋が見つかりません" / 429 / 500

**所有権**: usecase.ensureOwner: repo.FindByID(id) は id のみで検索（userId 条件なし）し、取得後に p.UserID != userID を比較して 403。存在しない場合は 404。「他人の ID を叩くと 404 ではなく 403 が返る」ため ID の存在有無が漏れる点に注意。

**ドメイン規則**: 副作用なし。

### PATCH /api/prescriptions/{prescriptionId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `prescriptionId` | string (path param) | ○ | 形式検証なし。 |
| `prescriptionName` | string|null | — | binding タグ無し。空文字 "" を送ると空文字で上書きされる（Create と違い必須チェックが効かない）。null/未指定なら変更しない。 |
| `prescribedBy` | string|null | — | 未指定なら変更しない。null 明示でも NULL クリア不可。 |
| `prescribedAt` | string|null (日付文字列) | — | parseDate。パース失敗時は nil になり、400 を返さず「未指定」として黙って無視される。 |
| `expiresAt` | string|null (日付文字列) | — | 同上。NULL へのクリア不可。 |
| `pharmacyName` | string|null | — | 未指定なら変更しない。 |
| `electronicCode` | string|null | — | 未指定なら変更しない。 |
| `notes` | string|null | — | 未指定なら変更しない。 |

**レスポンス**: 更新後の Prescription 1件（items 込み。items はこのエンドポイントでは変更されない）。

**ステータス**: 200 成功 / 400 バインド失敗 "入力内容が正しくありません" / 401 未認証 / 403 "この処方箋にアクセスする権限がありません" / 404 "処方箋が見つかりません" / 429 / 500

**所有権**: ensureOwner（FindByID → p.UserID == JWT userID）を先に実行してから UPDATE。UPDATE 文自体の WHERE は "id" = ? のみで userId 条件は付かない。

**ドメイン規則**: 部分更新（non-nil のフィールドだけ map に積んで UPDATE）。更新対象フィールドが 0 件なら SQL を発行せず FindByID の結果だけ返す（PATCH {} は 200 で現状データ）。memberId・userId は更新不可（入力構造体に存在しない）。updatedAt 列が無いため更新時刻の記録は無し。

### DELETE /api/prescriptions/{prescriptionId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `prescriptionId` | string (path param) | ○ | 形式検証なし。 |

**レスポンス**: { "ok": true } （data の中身がリソースではなく固定オブジェクト）

**ステータス**: 200 成功 / 401 未認証 / 403 "この処方箋にアクセスする権限がありません" / 404 "処方箋が見つかりません" / 429 / 500

**所有権**: ensureOwner で 404/403 判定後に DELETE。DELETE 文の WHERE は "id" = ? のみ。

**ドメイン規則**: 物理削除。PrescriptionItem はアプリ側で削除しておらず、DB の FK "prescriptionId" ... ON DELETE CASCADE に依存して消える（Java/JPA 側では cascade または明示削除の実装が必須）。Dispense で作成済みの Medication は削除されず残る。

### PUT /api/prescriptions/{prescriptionId}/items

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `prescriptionId` | string (path param) | ○ | 形式検証なし。 |
| `items` | array of { name: string, dosage: string|null, frequency: string|null, days: number|null } | — | binding タグ無し。未指定・null・[] のいずれでも 400 にならず、既存明細を全削除する全置換になる。各要素の name は usecase で空文字チェック（1件でも空なら全体を 400 で拒否）。dosage/frequency の長さ検証なし、days の範囲（負値・0）検証なし。sortOrder はリクエストで指定できず配列の添字が採番される。 |

**レスポンス**: 置換後の Prescription 1件（items 込み。ReplaceItems 後に FindByID で再取得したもの）。

**ステータス**: 200 成功 / 400 バインド失敗 "明細の内容が正しくありません" もしくは検証失敗 "薬の名前は必須です" / 401 未認証 / 403 "この処方箋にアクセスする権限がありません" / 404 "処方箋が見つかりません" / 429 / 500

**所有権**: ensureOwner（親 Prescription の userId 一致）のみ。明細行そのものには userId 列が無く、親経由でしか所有権を辿れない。

**ドメイン規則**: 完全置換（delete-all → insert）。DELETE と INSERT は 1 トランザクション内（GORM Transaction）。sortOrder には配列インデックス i をそのまま採番。各行の id はアプリ生成 ID、createdAt は DB 既定値 now()。usecase で name 空文字を 400 にしているが、repository 側でも name=="" の行を skip する二重防御があり、skip されると sortOrder に欠番が生じる。返却は ReplaceItems 完了後の FindByID なので、置換直後の最新状態。

### POST /api/prescriptions/{prescriptionId}/dispense

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `prescriptionId` | string (path param) | ○ | 形式検証なし。リクエストボディは読まない（何を送っても無視）。 |

**レスポンス**: 作成された Medication[]（処方明細1行につき1件）。Medication = { id: string, memberId: string, userId: string, name: string, category: string, dosageAmount: string|null, frequency: string|null, stockQuantity: number|null, stockAlertDate: string|null, intervalHours: number|null, instructions: string|null, displayOrder: number, isActive: boolean, status: string, createdAt: string, updatedAt: string }。

**ステータス**: 201 成功 / 400 明細0件 "処方明細がありません" / 401 未認証 / 403 "この処方箋にアクセスする権限がありません" / 404 "処方箋が見つかりません" / 429 / 500

**所有権**: ensureOwner（Prescription.userId == JWT userID）のみ。作成する Medication の userId には JWT userID、memberId には処方箋の memberId をそのまま使う。この時点で Member 側の所有権再確認（ensureMemberOwner）は行っていない。

**ドメイン規則**: 処方明細 → 服薬管理(Medication) の一括変換。マッピングは name→name、dosage→dosageAmount、frequency→frequency、category は常に固定文字列 "regular"。明細の days・sortOrder は使われない（在庫 stockQuantity も未設定）。displayOrder / isActive / status は DB 既定値（0 / true / 'active'）に委ねる。作成済みマーク（dispensedAt 等）を持たないため何度でも実行でき、実行のたびに Medication が重複作成される。ループ内で1件ずつ Create し、トランザクションで囲われていない。

## schedule

### 移植時の注意

■ タイムゾーン（移植時の最重要ポイント）
- GET /api/schedules/today は handler が time.Now() を渡すだけで、TZ 指定もクエリパラメータもない。schedule_repository.go:137-139 で date.Weekday() と date.Location() を使うため、曜日判定と当日範囲（isCompleted）の両方がサーバのローカルTZに依存する。
- backend/Dockerfile に TZ 環境変数はなく、ベースが gcr.io/distroless/static-debian12 なので実行時 TZ は実質 UTC。日本のユーザーにとって「今日」が UTC 基準になり、JST の 00:00-09:00 は前日として扱われる。Java 側は Asia/Tokyo 固定にするか、クライアントから日付/TZ を受け取る形にするのが望ましい（挙動が変わるので要合意）。

■ 実装されていないドメイン規則（列だけ存在して未使用）
- GetTodaySchedules の SQL は startDate も intervalDays も参照していない。開始日が未来のスケジュールも「今日の予定」に出るし、「N日おき」の間隔指定は完全に未実装。エンティティ・DB列・入力APIには存在するのに読み取り専用状態。Java 移植では「Go と同じ（未実装のまま）」か「正しく実装する」かを明示的に決める必要がある。
- daysOfWeek が空配列のときは「毎日」扱い（array_length(...) IS NULL の判定。Postgres は空配列に対し array_length が NULL を返す）。この暗黙ルールは Java 側でも再現が必要。

■ ソート順の危うさ
- "scheduledTime" は TEXT 列で、List / Today ともに ORDER BY "scheduledTime" ASC の辞書順。ゼロ埋めされていない "9:00" は "10:00" より後に並ぶ。しかも scheduledTime のフォーマット検証はどこにも無い（binding:"required" のみ）。Java 側では LocalTime 化するか、最低でも "HH:mm" の正規表現検証を入れるべき。

■ 入力検証がほぼ存在しない
- daysOfWeek の値（sun..sat）を検証していないため "monday" や "月" を保存でき、その予定は Today に永遠に出てこない（サイレント失敗）。
- intervalDays / reminderMinutesBefore に符号・範囲の検証がなく、負値も保存できる。
- POST のバインドエラーはすべて 400 "予定時刻と薬の指定は必須です" に潰され、原因フィールドが分からない。PATCH は "入力内容が正しくありません"。

■ parseDate のサイレント無効化（handler/helpers.go:6-17）
- 解析できない startDate 文字列（例 "2026-13-45", "abc"）は 400 にならず nil = 未指定として扱われる。POST では startDate なしで作成され、PATCH では「更新しない」になる。ユーザーには成功に見えるがデータは入らない。Java では明示的に 400 を返すべき。
- "2006-01-02" 形式で解析した場合 time.Parse はロケーション指定がないため UTC 解釈になる。JST 前提のクライアントとは 9 時間ずれた TIMESTAMPTZ が入る。

■ null に戻せないフィールド
- PATCH の intervalDays / startDate はポインタの nil を「未指定 = 更新しない」に使っているため、いったん値を入れると API 経由で NULL に戻せない。daysOfWeek だけは [] を明示送信すれば空にできる（Go の JSON では省略/null は nil、[] は非nilの空スライスになるため）。Java(Jackson) は省略と null を素直には区別できないので、JsonNullable / Optional などで意図的に作り分けないと挙動が変わる。

■ 所有権・整合性
- 所有権チェック自体は漏れていない。POST は Medication.userId、PATCH/DELETE は Schedule.userId を認証ユーザーと突き合わせている。memberId をリクエストで受け取らず medication から導出しているのも良い（他人の member に紐付けられない）。
- ただし Repository の Update / Delete は WHERE "id" = ? のみで userId を含まないため、usecase を通らない呼び出し経路が増えると即座に他人のデータを触れる。Java 側は WHERE に userId を含める（所有者付き derived query にする）ほうが安全。
- ensureOwner の SELECT と UPDATE/DELETE、POST の medication 取得と INSERT はいずれもトランザクションで囲まれていない（TOCTOU）。実害は小さいが移植時に @Transactional を付けるのが自然。

■ 参照整合性の穴
- migrations/0001_init.sql の "MedicationRecord"."scheduleId" は TEXT で FK 制約が無い。Schedule を DELETE しても MedicationRecord.scheduleId は孤児として残り、そのIDが再利用されれば誤集計になりうる。DELETE 時のクリーンアップ処理も無い。
- "Schedule"."memberId" も TEXT NOT NULL で FK 制約が無い（medicationId / userId には ON DELETE CASCADE の FK がある）。Today の SQL は Member を INNER JOIN しているので、対応する Member 行が無い Schedule はエラーにならず一覧から黙って消える。

■ isCompleted の意味
- 当日の MedicationRecord が1件でもあれば true。1日に同じスケジュールを複数回服用する運用は表現できない（1回目で完了扱い）。仕様として引き継ぐか要確認。

■ 単なる CRUD として移せる部分 / ドメイン規則として移すべき部分
- 単なる CRUD: List / Update / Delete 本体（userId 絞り込みと所有権チェックさえ再現すれば良い）。
- ドメイン規則として必ず移すべきもの: (1) POST での memberId のサーバ側導出、(2) isEnabled=true / reminderMinutesBefore=5 / daysOfWeek=[] の既定値、(3) Today の抽出条件一式（isEnabled、Medication.isActive、status NOT IN ('paused','discontinued')、曜日一致、空配列=毎日）、(4) isCompleted の EXISTS 判定、(5) 曜日文字列 sun/mon/tue/wed/thu/fri/sat の固定表現。

■ 共通事項
- 認証は Authorization: Bearer <JWT> のみ（middleware/auth.go）。欠落・検証失敗は 401 {"success":false,"error":"認証エラー"}。
- 認証済みグループ全体に middleware.RateLimit("api", 120, 1分, PerUser) が掛かり、超過で 429 {"success":false,"error":"リクエストが多すぎます。しばらくしてから再試行してください。"}。インメモリ実装なのでインスタンスがスケールすると実質無効化される点も移植時の検討事項。
- HandleDomainError（pkg/response/response.go:34-53）のマッピング: NotFoundError→404, ConflictError→409, ValidationError→400, ForbiddenError→403, その他→500 "サーバーエラーが発生しました"。schedule では Conflict / Validation を投げる経路が存在しないため、実際に出るのは 400（バインドエラーのみ）/403/404/500。
- 実装の混在: 読み取り（ListByUser/FindByID）は sqlc、書き込み（Create/Update/Delete）は GORM、Today は pgx 生SQL。Java では単一の永続化手段に統一して良い。
- 参照ファイル: /Users/takuma.kawano/HealthFamily/backend/internal/interface/router/router.go:89-93, /Users/takuma.kawano/HealthFamily/backend/internal/interface/handler/schedule_handler.go, /Users/takuma.kawano/HealthFamily/backend/internal/interface/handler/helpers.go, /Users/takuma.kawano/HealthFamily/backend/internal/usecase/schedule_usecase.go, /Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/persistence/schedule_repository.go, /Users/takuma.kawano/HealthFamily/backend/internal/infrastructure/sqlc/queries/schedule.sql, /Users/takuma.kawano/HealthFamily/backend/internal/domain/entity/entities.go:58-100, /Users/takuma.kawano/HealthFamily/backend/internal/domain/repository/repository.go:86-117, /Users/takuma.kawano/HealthFamily/backend/migrations/0001_init.sql:59-86, /Users/takuma.kawano/HealthFamily/backend/internal/pkg/response/response.go
- 既存テストは router_smoke_test.go でハンドラを nil usecase で生成しているだけで、schedule の振る舞いを検証するテストは存在しない（移植時の回帰比較の土台が無い）。

### GET /api/schedules

**レスポンス**: data: Schedule[]（0件でも null ではなく []）
Schedule = {
  id: string,
  medicationId: string,
  userId: string,
  memberId: string,
  scheduledTime: string,      // TEXT列。フォーマット検証なし（"08:00" 想定だが強制されていない）
  daysOfWeek: string[],       // NOT NULL。空配列は「毎日」扱い
  intervalDays: number | null,
  startDate: string | null,   // RFC3339 (TIMESTAMPTZ)
  isEnabled: boolean,
  reminderMinutesBefore: number,
  createdAt: string           // RFC3339
}

**ステータス**: 200: 成功 / 401: Bearer欠落・検証失敗（error="認証エラー"）/ 429: レート制限（api, 120req/min, ユーザーID単位）/ 500: DBエラー（error="サーバーエラーが発生しました"）

**所有権**: sqlc ListSchedulesByUser の WHERE "userId" = $1 で JWT の userID に絞る。追加の所有権チェックは無い。

**ドメイン規則**: ORDER BY "scheduledTime" ASC。ただし scheduledTime は TEXT 列なので辞書順（ゼロ埋めが無いと "9:00" が "10:00" の後に来る）。フィルタ・集計・副作用なしの純粋な一覧取得。

### POST /api/schedules

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `medicationId` | string | ○ | binding:"required"（空文字不可）。存在確認＋所有権確認あり。 |
| `scheduledTime` | string | ○ | binding:"required"（空文字不可）。フォーマット検証は一切なし（"HH:mm" 強制なし）。 |
| `daysOfWeek` | string[] | — | 検証なし。省略/null はリポジトリ層で空配列 [] に正規化（DB は NOT NULL DEFAULT '{}'）。値の妥当性（sun/mon/tue/wed/thu/fri/sat）は未チェック。 |
| `intervalDays` | number | null | — | 検証なし。負値・0 も通る。DB は NULL 許容。 |
| `startDate` | string | null | — | parseDate() が RFC3339 / "2006-01-02T15:04:05" / "2006-01-02" の順に解析。どれにも一致しなければエラーにせず黙って nil（未指定）扱い。 |
| `isEnabled` | boolean | null | — | 省略時はハンドラで true を既定値として設定。 |
| `reminderMinutesBefore` | number | null | — | 省略時はハンドラで 5 を既定値として設定。範囲・符号の検証なし。 |

**レスポンス**: data: Schedule（GET /api/schedules と同一形の1件）。INSERT 後に id で再SELECTするため DB 既定値（createdAt 等）反映後の値が返る。

**ステータス**: 201: 作成成功（response.Created）/ 400: JSONバインド失敗（error="予定時刻と薬の指定は必須です" 固定文言。原因フィールドは分からない）/ 401: 未認証 / 403: 他人の薬（error="この薬にアクセスする権限がありません"）/ 404: 薬が存在しない（error="薬が見つかりません"）/ 429: レート制限 / 500: DBエラー

**所有権**: MedicationRepository.FindByID(medicationId) → nil なら 404、med.UserID != 認証ユーザーID なら 403。Schedule.userId は JWT の値を強制使用し、リクエストからは受け取らない。

**ドメイン規則**: 【重要な導出規則】memberId はリクエストから受け取らず、必ず対象 Medication の memberId をコピーする（in.MemberID = med.MemberID）。Java でも同様にサーバ側導出にすること。
【既定値】isEnabled 未指定→true、reminderMinutesBefore 未指定→5、daysOfWeek 未指定→[]（NOT NULL 列対策）。
【副作用】Schedule 行を1件 INSERT するのみ。通知登録などの副作用は無い。
【トランザクション】medication 取得と INSERT が同一トランザクションでない（トランザクション自体を張っていない）。

### GET /api/schedules/today

**レスポンス**: data: TodaySchedule[]（0件でも []）
TodaySchedule = Schedule の全フィールドをフラットに展開 + {
  medicationName: string,          // Medication.name
  memberName: string,              // Member.name
  memberType: string,              // Member.memberType
  medicationDisplayOrder: number,  // Medication.displayOrder
  isCompleted: boolean             // 当日の MedicationRecord 有無
}

**ステータス**: 200: 成功 / 401: 未認証 / 429: レート制限 / 500: DBエラー

**所有権**: 生SQL の WHERE s."userId" = $1 のみ。Member / Medication 側の userId は再検証していない（作成時に medication 所有権を確認済みという前提に依存）。

**ドメイン規則**: 抽出条件（生SQL, pgx）:
  Schedule JOIN Medication ON id=medicationId JOIN Member ON id=memberId（どちらも INNER JOIN）
  AND s."isEnabled" = TRUE
  AND m."isActive" = TRUE
  AND m."status" NOT IN ('paused','discontinued')
  AND (array_length(s."daysOfWeek",1) IS NULL OR <当日曜日> = ANY(s."daysOfWeek"))
  ORDER BY s."scheduledTime" ASC（TEXT の辞書順）
曜日は Go の time.Weekday() を ["sun","mon","tue","wed","thu","fri","sat"] に写像した固定文字列。
isCompleted = EXISTS(SELECT 1 FROM "MedicationRecord" r WHERE r."scheduleId" = s."id" AND r."takenAt" >= 当日0時 AND r."takenAt" < 翌日0時)。
日付基準はハンドラの time.Now()（クエリパラメータでの日付指定は不可）。dayStart/dayEnd は date.Location()（サーバのローカルTZ）で算出。
【未実装】startDate と intervalDays はこのクエリで一切参照されない。

### PATCH /api/schedules/{scheduleId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `scheduleId` | string | ○ | パスパラメータ（gin :scheduleId）。形式検証なし。 |
| `scheduledTime` | string | null | — | *string。省略/null なら更新しない。空文字 "" は更新対象になり空文字で上書きされる（検証なし）。 |
| `daysOfWeek` | string[] | null | — | []string。省略/null なら更新しない。[] を明示送信すると空配列で上書き（=毎日扱い）。値の妥当性検証なし。 |
| `intervalDays` | number | null | — | *int。省略/null なら更新しない → NULL に戻す手段が無い。 |
| `startDate` | string | null | — | parseDate() で解析。解析不能・空文字は nil → 更新しない（400 にはならない）。→ NULL に戻す手段が無い。 |
| `isEnabled` | boolean | null | — | *bool。省略/null なら更新しない。 |
| `reminderMinutesBefore` | number | null | — | *int。省略/null なら更新しない。範囲検証なし。 |

**レスポンス**: data: Schedule（更新後に id で再SELECTした1件。更新対象が0件でも現在値をそのまま返す）

**ステータス**: 200: 成功 / 400: JSONバインド失敗（error="入力内容が正しくありません"）/ 401: 未認証 / 403: 他人のスケジュール（error="このスケジュールにアクセスする権限がありません"）/ 404: 不存在（error="スケジュールが見つかりません"）/ 429: レート制限 / 500: DBエラー

**所有権**: ScheduleUsecase.ensureOwner: schedules.FindByID(id) → nil なら 404、s.UserID != 認証ユーザーID なら 403。その後 Repository.Update の WHERE は "id" のみで userId ガードを持たない（usecase 頼み）。

**ドメイン規則**: 部分更新。非nilのフィールドだけを map に詰めて GORM Updates。更新対象が1つも無ければ UPDATE を発行せず現在値を返す（204 ではなく 200）。
medicationId / memberId / userId は変更不可（更新入力に存在しない）。
updatedAt 相当の列は Schedule テーブルに存在しない（createdAt のみ）。
副作用なし。ensureOwner の SELECT と UPDATE は同一トランザクションではない。

### DELETE /api/schedules/{scheduleId}

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `scheduleId` | string | ○ | パスパラメータ（gin :scheduleId）。形式検証なし。 |

**レスポンス**: data: { ok: true }（gin.H{"ok": true}）。削除済みリソースの内容は返さない。

**ステータス**: 200: 成功（204 ではない）/ 401: 未認証 / 403: 他人のスケジュール（error="このスケジュールにアクセスする権限がありません"）/ 404: 不存在（error="スケジュールが見つかりません"）/ 429: レート制限 / 500: DBエラー

**所有権**: ScheduleUsecase.ensureOwner で FindByID → 404 / userId 不一致 → 403。Repository.Delete は WHERE "id" = ? のみ（userId ガードなし）。

**ドメイン規則**: 物理削除（GORM Delete、論理削除フラグなし）。関連する MedicationRecord のクリーンアップは行わない。ensureOwner と DELETE は非トランザクション。
