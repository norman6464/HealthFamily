# Go 版 API 契約（Java 移植の元仕様）

Go 実装から抽出した契約。Java 側へ移すときの元にする。
推測ではなく、handler / usecase / repository / SQL から確認した内容のみを載せている。

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
| `weight` | *float64 | — | 省略/null なら未更新。null 送信で NULL クリアはできない（フロントは weight?: number|null を送る設計なので意図と食い違う） |
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

## misc-crud (allergies / insurances / emergency-contacts / notification-settings / dashboard-preferences)

### 移植時の注意

【共通の契約】
- ルート登録: /api/allergies, /api/insurances, /api/emergency-contacts, /api/notification-settings は internal/interface/router/routes_ext.go（それぞれ 68-74行, 60-66行, 93-99行, 111-114行）。/api/dashboard-preferences のみ router.go:113-114 に直接登録。すべて `authed` グループ配下で middleware.Auth(JWT) + middleware.RateLimit("api", 120, 1分, PerUser) が適用される。
- レスポンス形式は response.go の通り { success: true, data } / { success: false, error }。Success=200, Created=201。HandleDomainError: NotFoundError→404, ConflictError→409, ValidationError→400, ForbiddenError→403, それ以外→500 "サーバーエラーが発生しました"。この 5 リソースの usecase は ConflictError/ValidationError を一切生成しないので、実際に出るのは 400(バインド失敗のみ)/401/403/404/429/500。
- 401 の本文は必ず { success:false, error:"認証エラー" }。429 は { success:false, error:"リクエストが多すぎます。しばらくしてから再試行してください。" }（in-memory・インスタンスローカル。Java 移植時は分散対応を検討）。
- allergies/insurances/emergency-contacts の 3 つは usecase/crud.go の汎用 `MemberScopedCRUD[E,C,U]` を型パラメータだけ変えて共有しているだけで、リソース固有のドメインロジックは **一切ない**（差分は notFoundName と forbiddenMsg の文言のみ）。Java 側でも共通抽象クラス/ジェネリックサービスに寄せられる。
- テーブル・カラム名は Prisma 時代の camelCase でクォート必須（"Allergy"."allergenName" 等）。JPA では @Table(name="\"Allergy\"") / @Column(name="\"allergenName\"") 相当が必要。
- Allergy/Insurance/EmergencyContact の userId・memberId は User/Member への FK ON DELETE CASCADE 付き（migrations/0001_init.sql:158-223）。メンバー削除で自動的に消える。

【Java 側にドメイン規則として移すべきもの（単なる CRUD ではない部分）】
1. 作成時のメンバー所有権チェック（usecase/ownership_ext.go）: member が無ければ 404「メンバーが見つかりません」、他人のものなら 403「このメンバーにアクセスする権限がありません」。userId は必ず JWT から入れ、リクエストボディの userId は受け付けない。
2. 取得/更新/削除時の行所有権チェック（crud.go ensureOwner）: 404 判定→403 判定の順序と文言をそのまま維持する必要がある。
3. NotificationSetting / DashboardPreference の「行が無ければ保存せず既定値を返す」挙動（Get は副作用なし）。
4. NotificationSetting Upsert の INSERT 経路 = 未指定を true/5/1 で補完、UPDATE 経路 = 指定項目のみ更新、という非対称な合成規則。
5. DashboardPreference の defaultMemberId 空文字→null 正規化と、hiddenCards/cardOrder の null→[] 正規化。

【Go 側の不具合・危うい実装（移植時に直すか、意図的に踏襲するか判断が必要）】
A. **DashboardPreference.defaultMemberId に所有権チェックも存在チェックも FK もない**（usecase/dashboard_preference_usecase.go:32-37 は MemberRepository を持たない / migrations/0004_budget_personalization.sql の DDL に FK なし）。他人の memberId や存在しない ID をそのまま保存できる。Member 削除後もダングリング参照が残る。Java 側では ensureMemberOwner 相当を入れるべき。
B. **PUT /dashboard-preferences が破壊的**。省略したキーは [] に正規化されて ON CONFLICT DO UPDATE で EXCLUDED 上書きされるため、defaultMemberId だけ送ると hiddenCards と cardOrder が消える。現行フロント(frontend/src/pages/home/ui/DashboardSettings.tsx)は 3 フィールドを常に全部送るので顕在化していないだけ。
C. **PATCH でヌル化ができない**。全リソースの Update 入力がポインタで「nil = 未指定」なので、JSON で null を送っても notes / symptoms / relationship / providerName / policyNumber / diagnosedAt を NULL に戻せない。逆に空文字 "" は「値」として通るので、NOT NULL 列である allergenName / contactName / phoneNumber / insuranceType を空文字に更新できてしまう（Create には binding:"required" があるのに Update には無い、という非対称）。
D. **不正な日付が黙って無視される**（handler/helpers.go parseDate）。diagnosedAt に "2026-13-45" のようなパース不能文字列を送っても 400 にならず、Create では NULL、Update では「未指定扱い」でスキップされる。Java の LocalDate/OffsetDateTime パースだと例外→400 になるので、意図的に合わせないと挙動が変わる。
E. **所有権チェックと UPDATE/DELETE が TOCTOU かつ非トランザクション**。ensureOwner で SELECT した後、UPDATE/DELETE の WHERE は `"id" = ?` のみで userId を含まない（allergy_repository.go:106,114 ほか同型）。Java 側では WHERE に userId を含めて 1 文で済ませるのが安全。
F. **Create/Update の read-after-write が非トランザクションかつ別ドライバ**（書き込み GORM / 読み戻し pgx+sqlc）。FindByID が pgx.ErrNoRows を返すと repository は (nil, nil) を返し、ハンドラは 201 or 200 で `"data": null` を返す（エラーにならない）。Java では INSERT/UPDATE の返り値をそのまま使うべき。
G. NotificationSetting の分数・日数に範囲検証が無い（負値・0・巨大値が保存できる）。int32 を超える値は DB エラーで 500 になる。
H. GET /notification-settings の未作成時レスポンスに id: ""、createdAt/updatedAt: "0001-01-01T00:00:00Z" という Go のゼロ値が漏れる。Java で LocalDateTime のゼロ値を再現するのは不自然なので、フロント(frontend/src/pages/settings-notifications/ui/NotificationSettingsPage.tsx は enabled 系フィールドしか使っていない)を確認のうえ null にするなど契約変更を検討する余地がある。
I. DELETE は 200 + { ok: true } を返す（204 でもエンティティでもない）。作成は 201、通知設定/ダッシュボード設定の PUT は新規作成でも 200。この不揃いをそのまま維持すること。
J. allergyType / severity / insuranceType など enum らしきフィールドがすべて自由文字列で、長さ制限も無い（DB は TEXT）。Insurance.policyNumber（保険証番号）も平文保存・平文返却。
K. 一覧 API に memberId 等の絞り込みクエリが無く、ユーザーの全件を返す（フロントが取得後にクライアント側でフィルタしている: frontend/src/pages/member-detail/ui/MemberDetail.tsx, member-report/ui/MemberReport.tsx）。ページングも無い。

### GET /api/allergies

**レスポンス**: data: Allergy[] （必ず配列。0件でも null ではなく []）。Allergy = { id: string, userId: string, memberId: string, allergenName: string, allergyType: string, severity: string, symptoms: string|null, diagnosedAt: string(RFC3339)|null, notes: string|null, createdAt: string(RFC3339) }

**ステータス**: 200 成功 / 401 "認証エラー"(Bearer 無し・JWT不正) / 429 "リクエストが多すぎます。しばらくしてから再試行してください。" / 500 "サーバーエラーが発生しました"

**所有権**: SQL 側で WHERE "userId" = $1。認証ユーザー所有の行のみ。memberId でのサーバー側フィルタは無い（フロントが取得後にクライアント側で絞り込んでいる）

**ドメイン規則**: sqlc ListAllergies: SELECT ... FROM "Allergy" WHERE "userId"=$1 ORDER BY "createdAt" DESC。計算・副作用なし

### POST /api/allergies

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required" — キー欠落も空文字も 400。所有権チェックあり |
| `allergenName` | string | ○ | binding:"required" — 空文字不可。長さ・文字種の検証なし(DB は TEXT) |
| `allergyType` | string | ○ | binding:"required" — 自由文字列。enum 検証なし |
| `severity` | string | ○ | binding:"required" — 自由文字列。enum 検証なし |
| `symptoms` | string|null | — | 検証なし |
| `diagnosedAt` | string|null | — | parseDate() で RFC3339 / "2006-01-02T15:04:05" / "2006-01-02" の順に試行。どれにも一致しない不正文字列・空文字は **エラーにならず nil** になり NULL 保存される |
| `notes` | string|null | — | 検証なし |

**レスポンス**: data: Allergy（上記と同一形状）。作成後に FindByID で再取得した値を返す。まれに data: null になり得る（notes 参照）

**ステータス**: 201 作成成功 / 400 バインド失敗時 固定文言 "メンバーID・アレルゲン名・種別・重症度は必須です"（フィールド別メッセージではない） / 401 / 403 "このメンバーにアクセスする権限がありません" / 404 "メンバーが見つかりません" / 429 / 500

**所有権**: usecase.ensureMemberOwner: members.FindByID(memberId) → nil なら 404「メンバーが見つかりません」、m.UserID != 認証userID なら 403「このメンバーにアクセスする権限がありません」。userId はボディではなく JWT から設定される（クライアント指定不可）

**ドメイン規則**: id は auth.NewID() でサーバー生成。createdAt は DB DEFAULT now()。メンバー所有チェックと INSERT は同一トランザクションではない（FK 制約が最後の砦）。GORM で INSERT → pgx(sqlc) で SELECT し直す read-after-write

### GET /api/allergies/:allergyId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `allergyId` | string (path param) | ○ | 形式検証なし |

**レスポンス**: data: Allergy

**ステータス**: 200 / 401 / 403 "このアレルギー情報にアクセスする権限がありません" / 404 "アレルギーが見つかりません" / 429 / 500

**所有権**: MemberScopedCRUD.ensureOwner: FindByID(id) が nil → 404、entity.UserID != 認証userID → 403。404 判定が先で 403 が後（存在の有無は他人にも漏れる設計ではない＝存在すれば 403 を返すため ID 存在は推測可能）

**ドメイン規則**: 単純取得。sqlc GetAllergy は WHERE "id"=$1 のみ（userId 条件なし）でアプリ層が所有権を判定している

### PATCH /api/allergies/:allergyId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `allergyId` | string (path param) | ○ | — |
| `allergenName` | string|null | — | 未指定(nil)なら更新しない。空文字 "" を送ると空文字で上書きされる（必須検証は Update には無い） |
| `allergyType` | string|null | — | 同上 |
| `severity` | string|null | — | 同上 |
| `symptoms` | string|null | — | null を送っても NULL に戻せない（nil = 未指定扱い） |
| `diagnosedAt` | string|null | — | parseDate。不正文字列・空文字は nil になり **黙って無視**（400 にならない）。NULL に戻す手段がない |
| `notes` | string|null | — | null で NULL に戻せない |

**レスポンス**: data: Allergy（更新後に再取得した値）

**ステータス**: 200 / 400 "入力内容が正しくありません"（JSON 不正・ボディ空(EOF)含む） / 401 / 403 / 404 / 429 / 500

**所有権**: ensureOwner で 404/403 判定した後、UPDATE の WHERE は "id" のみ（userId を含まない）。memberId は変更不可（Update 入力に存在しない）

**ドメイン規則**: 部分更新: 非 nil のフィールドだけ map に詰めて GORM Updates。全フィールド nil（{} 送信）なら DB 更新を行わず現在値を 200 で返す。updatedAt 列は Allergy には存在しない

### DELETE /api/allergies/:allergyId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `allergyId` | string (path param) | ○ | — |

**レスポンス**: data: { ok: true }（削除したエンティティは返さない）

**ステータス**: 200（204 ではない） / 401 / 403 / 404 / 429 / 500

**所有権**: ensureOwner で 404/403 判定後に DELETE。DELETE の WHERE も "id" のみ

**ドメイン規則**: 物理削除。カスケード先なし

### GET /api/insurances

**レスポンス**: data: Insurance[]（0件でも []）。Insurance = { id, userId, memberId, insuranceType: string, providerName: string|null, policyNumber: string|null, notes: string|null, createdAt: string(RFC3339) }

**ステータス**: 200 / 401 / 429 / 500

**所有権**: WHERE "userId" = 認証userID

**ドメイン規則**: ORDER BY "createdAt" DESC。policyNumber（保険証番号）を平文でそのまま返す点に注意

### POST /api/insurances

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required"（空文字不可） |
| `insuranceType` | string | ○ | binding:"required"。enum 検証なし・自由文字列 |
| `providerName` | string|null | — | 検証なし |
| `policyNumber` | string|null | — | 検証なし（マスキング・暗号化もなし） |
| `notes` | string|null | — | 検証なし |

**レスポンス**: data: Insurance

**ステータス**: 201 / 400 "メンバーIDと保険種別は必須です" / 401 / 403 "このメンバーにアクセスする権限がありません" / 404 "メンバーが見つかりません" / 429 / 500

**所有権**: ensureMemberOwner（memberId が認証ユーザー所有か）。userId は JWT 由来

**ドメイン規則**: id サーバー生成、createdAt は DB DEFAULT now()。計算・副作用なし

### GET /api/insurances/:insuranceId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `insuranceId` | string (path param) | ○ | — |

**レスポンス**: data: Insurance

**ステータス**: 200 / 401 / 403 "この保険にアクセスする権限がありません" / 404 "保険が見つかりません" / 429 / 500

**所有権**: ensureOwner（entity.userId == 認証userID）

**ドメイン規則**: 単純取得

### PATCH /api/insurances/:insuranceId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `insuranceId` | string (path param) | ○ | — |
| `insuranceType` | string|null | — | 未指定なら不変。空文字で上書き可能（必須検証なし） |
| `providerName` | string|null | — | null で NULL に戻せない |
| `policyNumber` | string|null | — | null で NULL に戻せない |
| `notes` | string|null | — | null で NULL に戻せない |

**レスポンス**: data: Insurance（更新後）

**ステータス**: 200 / 400 "入力内容が正しくありません" / 401 / 403 / 404 / 429 / 500

**所有権**: ensureOwner 後に WHERE "id" のみで UPDATE

**ドメイン規則**: 部分更新。{} なら DB 更新せず現在値を返す

### DELETE /api/insurances/:insuranceId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `insuranceId` | string (path param) | ○ | — |

**レスポンス**: data: { ok: true }

**ステータス**: 200 / 401 / 403 / 404 / 429 / 500

**所有権**: ensureOwner 後に WHERE "id" のみで DELETE

**ドメイン規則**: 物理削除

### GET /api/emergency-contacts

**レスポンス**: data: EmergencyContact[]（0件でも []）。EmergencyContact = { id, userId, memberId, contactName: string, phoneNumber: string, relationship: string|null, notes: string|null, createdAt: string(RFC3339) }

**ステータス**: 200 / 401 / 429 / 500

**所有権**: WHERE "userId" = 認証userID

**ドメイン規則**: ORDER BY "createdAt" DESC

### POST /api/emergency-contacts

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `memberId` | string | ○ | binding:"required" |
| `contactName` | string | ○ | binding:"required"（空文字不可） |
| `phoneNumber` | string | ○ | binding:"required" のみ。**電話番号の書式検証は一切なし**（DB も TEXT NOT NULL） |
| `relationship` | string|null | — | 検証なし |
| `notes` | string|null | — | 検証なし |

**レスポンス**: data: EmergencyContact

**ステータス**: 201 / 400 "メンバーID・連絡先名・電話番号は必須です" / 401 / 403 "このメンバーにアクセスする権限がありません" / 404 "メンバーが見つかりません" / 429 / 500

**所有権**: ensureMemberOwner。userId は JWT 由来

**ドメイン規則**: id サーバー生成、createdAt は DB DEFAULT now()

### GET /api/emergency-contacts/:contactId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `contactId` | string (path param) | ○ | — |

**レスポンス**: data: EmergencyContact

**ステータス**: 200 / 401 / 403 "この緊急連絡先にアクセスする権限がありません" / 404 "緊急連絡先が見つかりません" / 429 / 500

**所有権**: ensureOwner

**ドメイン規則**: 単純取得

### PATCH /api/emergency-contacts/:contactId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `contactId` | string (path param) | ○ | — |
| `contactName` | string|null | — | 未指定なら不変。空文字で上書き可能（NOT NULL 列だが空文字は通る） |
| `phoneNumber` | string|null | — | 同上。書式検証なし |
| `relationship` | string|null | — | null で NULL に戻せない |
| `notes` | string|null | — | null で NULL に戻せない |

**レスポンス**: data: EmergencyContact（更新後）

**ステータス**: 200 / 400 "入力内容が正しくありません" / 401 / 403 / 404 / 429 / 500

**所有権**: ensureOwner 後に WHERE "id" のみで UPDATE

**ドメイン規則**: 部分更新。{} なら DB 更新せず現在値を返す

### DELETE /api/emergency-contacts/:contactId

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `contactId` | string (path param) | ○ | — |

**レスポンス**: data: { ok: true }

**ステータス**: 200 / 401 / 403 / 404 / 429 / 500

**所有権**: ensureOwner 後に WHERE "id" のみで DELETE

**ドメイン規則**: 物理削除

### GET /api/notification-settings

**レスポンス**: data: NotificationSetting = { id: string, userId: string, medicationReminderEnabled: bool, missedMedicationEnabled: bool, appointmentReminderEnabled: bool, lowStockAlertEnabled: bool, defaultReminderMinutesBefore: int, defaultAppointmentReminderDaysBefore: int, emailNotificationEnabled: bool, createdAt: string(RFC3339), updatedAt: string(RFC3339) }。行が未作成の場合は **DB に保存せず** 既定値オブジェクトを返す: 4つの bool = true, defaultReminderMinutesBefore = 5, defaultAppointmentReminderDaysBefore = 1, emailNotificationEnabled = true, id = ""（空文字）, createdAt/updatedAt = "0001-01-01T00:00:00Z"（Go の time.Time ゼロ値）

**ステータス**: 200（未作成でも 404 ではなく 200 + 既定値） / 401 / 429 / 500

**所有権**: userId は JWT 由来。SELECT ... WHERE "userId" = $1。ユーザー単位の単一行（DB 側 UNIQUE 制約あり）

**ドメイン規則**: NotificationSettingUsecase.Get: repo が nil を返したら遅延生成せずデフォルト entity を組み立てて返す（副作用なし）

### PUT /api/notification-settings

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `medicationReminderEnabled` | bool|null | — | nil = 未指定 |
| `missedMedicationEnabled` | bool|null | — | nil = 未指定 |
| `appointmentReminderEnabled` | bool|null | — | nil = 未指定 |
| `lowStockAlertEnabled` | bool|null | — | nil = 未指定 |
| `defaultReminderMinutesBefore` | int|null | — | **範囲検証なし**。負値・巨大値もそのまま保存（DB は INTEGER NOT NULL なので int32 超過は 500） |
| `defaultAppointmentReminderDaysBefore` | int|null | — | **範囲検証なし**（負値可） |
| `emailNotificationEnabled` | bool|null | — | nil = 未指定 |

**レスポンス**: data: NotificationSetting（Upsert 後に再取得した実 DB 行。id/createdAt/updatedAt は実値）

**ステータス**: 200（201 ではない。新規作成時も 200） / 400 "入力内容が正しくありません"（JSON 不正・ボディ空） / 401 / 429 / 500

**所有権**: userId は必ず JWT 由来。ON CONFLICT ("userId") で自ユーザー行のみを更新するため他人の行に触れる経路はない

**ドメイン規則**: INSERT ... ON CONFLICT("userId") DO UPDATE。**INSERT 経路と UPDATE 経路で未指定フィールドの扱いが違う**: 行が無い場合は未指定を既定値(true / 5 / 1)で埋めて INSERT、既存行がある場合は指定されたフィールドのみ更新し未指定は既存値を維持。updatedAt は毎回 now() で更新。id は行が無いときだけ auth.NewID() が採用される

### GET /api/dashboard-preferences

**レスポンス**: data: DashboardPreference = { userId: string, hiddenCards: string[], cardOrder: string[], defaultMemberId: string|null } のみ。**id / createdAt / updatedAt は含まない**（NotificationSetting と形が違う）。行が未作成なら保存せず { userId, hiddenCards: [], cardOrder: [], defaultMemberId: null } を返す

**ステータス**: 200（未作成でも 200 + 既定値） / 401 / 429 / 500

**所有権**: userId は JWT 由来。SELECT ... WHERE "userId" = $1。ユーザー単位の単一行（DB 側 UNIQUE 制約あり）

**ドメイン規則**: DashboardPreferenceUsecase.Get: nil のとき空配列の既定値を返す（副作用なし）

### PUT /api/dashboard-preferences

| 項目 | 型 | 必須 | 検証 |
|---|---|---|---|
| `hiddenCards` | string[]|null | — | 要素の中身の検証なし（カードキーの enum 検証なし）。省略/null は [] に正規化され、既存値を **[] で上書きする** |
| `cardOrder` | string[]|null | — | 同上。重複・欠落・未知キーの検証なし。省略/null は [] で上書き |
| `defaultMemberId` | string|null | — | 空文字 "" は nil に正規化される。**メンバーの存在確認も所有権確認もしていない** |

**レスポンス**: data: DashboardPreference（Upsert 後に再取得した値。id/createdAt/updatedAt は含まない）

**ステータス**: 200（新規作成時も 200） / 400 "入力内容が正しくありません" / 401 / 429 / 500

**所有権**: userId は JWT 由来で ON CONFLICT("userId") のため行自体は自ユーザーに限定される。ただし **defaultMemberId の所有権チェックは無い**（DashboardPreferenceUsecase は MemberRepository を持っていない: cmd/server/main.go:70 で prefs リポジトリのみ注入）。DB 側にも FK 制約が無い（migrations/0004: "defaultMemberId" TEXT のみ）

**ドメイン規則**: INSERT ... ON CONFLICT("userId") DO UPDATE SET hiddenCards/cardOrder/defaultMemberId を EXCLUDED（今回の値）で全上書き + updatedAt = now()。完全置換セマンティクス（部分更新ではない）
