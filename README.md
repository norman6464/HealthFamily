# HealthFamily - 今お薬飲んでよ通知アプリ

> 家族もペットも、みんなの健康をキャラクターと一緒に守る服薬管理アプリ

---

## 目次

- [概要](#概要)
- [ターゲットユーザー](#ターゲットユーザー)
- [主要機能一覧](#主要機能一覧)
- [システムアーキテクチャ](#システムアーキテクチャ)
- [技術スタック](#技術スタック)
- [DynamoDB テーブル設計](#dynamodb-テーブル設計)
- [API 設計 (API Gateway + Lambda)](#api-設計-api-gateway--lambda)
- [フロントエンド設計 (React/TypeScript)](#フロントエンド設計-reacttypescript)
- [バックエンド設計 (Lambda/TypeScript)](#バックエンド設計-lambdatypescript)
- [通知システム設計](#通知システム設計)
- [キャラクターシステム](#キャラクターシステム)
- [ディレクトリ構成](#ディレクトリ構成)
- [Terraform インフラ管理](#terraform-インフラ管理)
- [開発環境セットアップ](#開発環境セットアップ)
- [開発ルール](#開発ルール)

---

## 概要

**「今お薬飲んでよ通知アプリ」** は、自分だけでなく家族やペットの服薬を一括管理できるヘルスケアアプリケーションです。

設定したアテンドキャラクター（犬・猫・うさぎ・インコ）が服薬時間を可愛くお知らせし、飲み忘れ防止をサポートします。

### コンセプト

| 状況 | キャラクターの反応 |
|------|-------------------|
| お薬の時間 | にゃいにゃい！って知らせてくる |
| 飲み忘れ | びゃいびゃい！って知らせてくる |
| 服薬完了 | 鳴き声で褒めてくれる |
| 運動達成 | 頑張った分だけ喜ぶ |

---

## ターゲットユーザー

### プライマリターゲット

| ターゲット | 詳細 |
|-----------|------|
| 複数の薬を服用する方 | 毎日複数回の服薬管理が必要な方（慢性疾患、生活習慣病など） |
| 高齢のご家族を持つ方 | 離れて暮らす両親・祖父母の服薬状況を見守りたい方 |
| 子育て世代 | 子どもの薬・ワクチン管理をしたい保護者 |
| ペットオーナー | フィラリア・ノミダニ予防薬など、ペットの投薬管理が必要な方 |

### セカンダリターゲット

| ターゲット | 詳細 |
|-----------|------|
| 健康意識が高い方 | サプリメント管理、栄養管理、運動管理をしたい方 |
| 頓服薬を使う方 | 頭痛薬など不定期な服薬の記録・間隔管理をしたい方 |
| 多頭飼いの飼い主 | 複数のペットの通院・投薬を管理したい方 |

---

## 主要機能一覧

### 1. 服薬管理（人間）

- 毎日のお薬・サプリメントの登録とリマインダー通知
- 頓服薬（頭痛薬など）のイレギュラー登録
  - 服薬時刻の記録
  - 次回服薬可能時刻の通知（例：「次は4時間後に服用可能です」）
- お薬の種類管理（家族メンバーごとに誰が何の薬を飲んでいるか）
- お薬の残数管理 → 残数が少なくなると病院予約リマインダーを表示
- 服薬完了記録

### 2. 服薬管理（ペット）

- プロフィール写真登録
- 通常のお薬（複数管理・項目追加可能）
- ノミダニ予防薬管理
- フィラリア薬管理
- サプリメント管理
- お薬残量管理 → 次回通院予約リマインダー

### 3. 通院・医療記録

- 通院日登録（人間・ペット共通）
- ワクチン接種日登録 → 次回接種日リマインダー
- 既往歴登録
  - 持病
  - 過去の大きな病気
  - 入院・手術歴
  - アレルギー有無
  - 薬の副作用記録
- かかりつけ病院登録（複数可）
- 検査結果登録
- 費用登録
- 健康診断リマインダー

### 4. 栄養管理

- ご飯の記録
- 栄養素の計算
- 今日何を食べたらいいかの提案

### 5. 運動管理

- お散歩記録
- ストレッチ記録
- ランニング記録
- 運動達成度に応じたキャラクターのリアクション

### 6. キャラクター（アテンド）システム

- 選択可能なキャラクター：犬、猫、うさぎ、インコ
- 服薬時間の通知（にゃいにゃい）
- 飲み忘れ時の再通知（びゃいびゃい）
- 服薬完了時の鳴き声（音声再生）
- 運動達成時のリアクション

---

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────┐
│                        クライアント層                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              React SPA (TypeScript)                           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │  │
│  │  │ 服薬管理  │ │ 通院管理  │ │ 栄養管理  │ │ キャラクター   │   │  │
│  │  │ 画面     │ │ 画面     │ │ 画面     │ │ 設定画面      │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                    AWS Amplify Hosting                               │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────┴───────────────────────────────────────┐
│                         API 層                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Amazon API Gateway                         │  │
│  │              (REST API / JWT認証)                              │  │
│  │  /users  /families  /members  /pets  /medications             │  │
│  │  /schedules  /records  /hospitals  /vaccines                  │  │
│  │  /medical-history  /nutrition  /exercises  /characters        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                     Amazon Cognito                                   │
│                    (認証・認可)                                       │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────────┐
│                      ビジネスロジック層                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐  │
│  │ 服薬管理   │ │ 通院管理    │ │ 栄養管理    │ │ キャラクター    │  │
│  │ Lambda     │ │ Lambda     │ │ Lambda     │ │ Lambda         │  │
│  │(TypeScript)│ │(TypeScript)│ │(TypeScript)│ │ (TypeScript)   │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────┘  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐  │
│  │ 運動管理   │ │ 通知処理    │ │ リマインダー │ │ ファイル管理    │  │
│  │ Lambda     │ │ Lambda     │ │ Lambda     │ │ Lambda         │  │
│  │(TypeScript)│ │(TypeScript)│ │(TypeScript)│ │ (TypeScript)   │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────┘  │
└──────┬──────────────┬──────────────┬──────────────┬─────────────────┘
       │              │              │              │
┌──────┴──────────────┴──────────────┴──────────────┴─────────────────┐
│                        データ層                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Amazon DynamoDB                            │  │
│  │  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │ Users     │ │Members   │ │Medicines │ │ Schedules     │  │  │
│  │  │ Table     │ │Table     │ │Table     │ │ Table         │  │  │
│  │  └───────────┘ └──────────┘ └──────────┘ └───────────────┘  │  │
│  │  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │ Records   │ │Hospitals │ │Nutrition │ │ Exercises     │  │  │
│  │  │ Table     │ │Table     │ │Table     │ │ Table         │  │  │
│  │  └───────────┘ └──────────┘ └──────────┘ └───────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Amazon S3    │  │ Amazon SNS   │  │ Amazon EventBridge       │  │
│  │ (画像保存)   │  │ (プッシュ通知) │  │ (スケジュール実行)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### アーキテクチャ構成図（サービス連携）

```
                    ┌─────────────┐
                    │   Cognito   │
                    │  User Pool  │
                    └──────┬──────┘
                           │ JWT Token
    ┌──────────┐    ┌──────┴──────┐    ┌──────────────┐
    │  React   │───▶│ API Gateway │───▶│   Lambda     │
    │  SPA     │◀───│  (REST)     │◀───│  Functions   │
    └──────────┘    └─────────────┘    └──────┬───────┘
         │                                     │
         │          ┌──────────────┐           │
         └─────────▶│   S3         │           │
          画像UP    │ (静的資産)    │           │
                    └──────────────┘           │
                                        ┌──────┴───────┐
                                        │              │
                                   ┌────┴────┐  ┌─────┴─────┐
                                   │DynamoDB │  │EventBridge│
                                   │         │  │ Scheduler │
                                   └─────────┘  └─────┬─────┘
                                                      │
                                                ┌─────┴─────┐
                                                │  Lambda   │
                                                │(通知処理)  │
                                                └─────┬─────┘
                                                      │
                                                ┌─────┴─────┐
                                                │    SNS    │
                                                │(Push通知)  │
                                                └───────────┘
```

---

## 技術スタック

### フロントエンド

| 技術 | 用途 |
|------|------|
| React 18 | UIフレームワーク |
| TypeScript 5 | 型安全な開発 |
| Vite | ビルドツール |
| React Router v6 | ルーティング |
| TanStack Query | サーバー状態管理 |
| Zustand | クライアント状態管理 |
| Tailwind CSS | スタイリング |
| Howler.js | キャラクター音声再生 |
| PWA (Workbox) | オフライン対応・プッシュ通知 |
| AWS Amplify | ホスティング・認証連携 |

### バックエンド

| 技術 | 用途 |
|------|------|
| AWS Lambda | サーバーレス関数 (TypeScript/Node.js 20) |
| Amazon API Gateway | REST API エンドポイント |
| Amazon DynamoDB | NoSQL データベース |
| Amazon Cognito | 認証・認可 |
| Amazon S3 | 画像・音声ファイル保存 |
| Amazon SNS | プッシュ通知 |
| Amazon EventBridge | スケジュールベースのリマインダー実行 |
| Terraform | IaC (Infrastructure as Code) |

### 開発ツール

| 技術 | 用途 |
|------|------|
| Docker / Docker Compose | ローカル開発環境 |
| DynamoDB Local | ローカルDB |
| ESLint + Prettier | コード品質 |
| Vitest | ユニットテスト |
| GitHub Actions | CI/CD |

---

## DynamoDB テーブル設計

### Users テーブル

ユーザーアカウント情報を管理する。

| 属性名 | 型 | キー | 説明 |
|--------|------|------|------|
| userId | S | PK | Cognito Sub (ユーザーID) |
| email | S | - | メールアドレス |
| displayName | S | - | 表示名 |
| characterType | S | - | 選択キャラクター (dog/cat/rabbit/bird) |
| characterName | S | - | キャラクターの名前 |
| createdAt | S | - | 作成日時 (ISO 8601) |
| updatedAt | S | - | 更新日時 (ISO 8601) |

### Members テーブル

家族メンバー・ペット情報を管理する。

| 属性名 | 型 | キー | 説明 |
|--------|------|------|------|
| memberId | S | PK | メンバーID (ULID) |
| userId | S | GSI-PK | 所有ユーザーID |
| memberType | S | GSI-SK | `human` / `pet` |
| name | S | - | 名前 |
| petType | S | - | ペット種別 (dog/cat/rabbit/bird/other) |
| photoUrl | S | - | プロフィール写真URL |
| birthDate | S | - | 生年月日 |
| notes | S | - | メモ |
| createdAt | S | - | 作成日時 |
| updatedAt | S | - | 更新日時 |

**GSI: UserMembers-index** (userId, memberType)

### Medications テーブル

お薬・サプリメント情報を管理する。

| 属性名 | 型 | キー | 説明 |
|--------|------|------|------|
| medicationId | S | PK | お薬ID (ULID) |
| memberId | S | GSI-PK | 対象メンバーID |
| userId | S | GSI-PK | 所有ユーザーID |
| name | S | - | お薬名 |
| category | S | - | 種別 (regular/supplement/prn/flea_tick/heartworm) |
| dosage | S | - | 用量 (例: "1錠") |
| frequency | S | - | 頻度 (例: "1日3回") |
| stockQuantity | N | - | 残数 |
| lowStockThreshold | N | - | 残数アラート閾値 |
| intervalHours | N | - | 頓服薬の服用間隔(時間) |
| instructions | S | - | 服用方法メモ |
| isActive | BOOL | - | 有効フラグ |
| createdAt | S | - | 作成日時 |
| updatedAt | S | - | 更新日時 |

**GSI: MemberMedications-index** (memberId, createdAt)
**GSI: UserMedications-index** (userId, category)

### Schedules テーブル

服薬スケジュール情報を管理する。

| 属性名 | 型 | キー | 説明 |
|--------|------|------|------|
| scheduleId | S | PK | スケジュールID (ULID) |
| medicationId | S | GSI-PK | お薬ID |
| userId | S | GSI-PK | ユーザーID |
| memberId | S | - | メンバーID |
| scheduledTime | S | GSI-SK | 予定時刻 (HH:mm) |
| daysOfWeek | L | - | 曜日 (例: ["mon","tue",...]) |
| isEnabled | BOOL | - | 有効フラグ |
| reminderMinutesBefore | N | - | 何分前に通知するか |
| createdAt | S | - | 作成日時 |

**GSI: UserSchedules-index** (userId, scheduledTime)
**GSI: MedicationSchedules-index** (medicationId)

### MedicationRecords テーブル

服薬記録を管理する。

| 属性名 | 型 | キー | 説明 |
|--------|------|------|------|
| recordId | S | PK | 記録ID (ULID) |
| memberId | S | GSI-PK | メンバーID |
| medicationId | S | GSI-PK | お薬ID |
| userId | S | GSI-PK | ユーザーID |
| takenAt | S | GSI-SK | 服薬日時 (ISO 8601) |
| scheduledTime | S | - | 予定時刻 |
| status | S | - | taken/skipped/late |
| notes | S | - | メモ |

**GSI: MemberRecords-index** (memberId, takenAt)
**GSI: UserDailyRecords-index** (userId, takenAt)

### Hospitals テーブル

かかりつけ病院情報を管理する。

| 属性名 | 型 | キー | 説明 |
|--------|------|------|------|
| hospitalId | S | PK | 病院ID (ULID) |
| userId | S | GSI-PK | ユーザーID |
| name | S | - | 病院名 |
| hospitalType | S | - | human/animal |
| address | S | - | 住所 |
| phoneNumber | S | - | 電話番号 |
| department | S | - | 診療科 |
| notes | S | - | メモ |
| createdAt | S | - | 作成日時 |

**GSI: UserHospitals-index** (userId, hospitalType)

### Appointments テーブル

通院・ワクチン・健康診断の予定を管理する。

| 属性名 | 型 | キー | 説明 |
|--------|------|------|------|
| appointmentId | S | PK | 予約ID (ULID) |
| userId | S | GSI-PK | ユーザーID |
| memberId | S | GSI-PK | メンバーID |
| hospitalId | S | - | 病院ID |
| appointmentType | S | - | visit/vaccine/checkup |
| appointmentDate | S | GSI-SK | 予約日 (ISO 8601) |
| description | S | - | 内容 |
| testResults | S | - | 検査結果 |
| cost | N | - | 費用 |
| reminderEnabled | BOOL | - | リマインダー有効 |
| reminderDaysBefore | N | - | 何日前に通知するか |
| createdAt | S | - | 作成日時 |

**GSI: UserAppointments-index** (userId, appointmentDate)
**GSI: MemberAppointments-index** (memberId, appointmentDate)

### MedicalHistory テーブル

既往歴を管理する。

| 属性名 | 型 | キー | 説明 |
|--------|------|------|------|
| historyId | S | PK | 既往歴ID (ULID) |
| memberId | S | GSI-PK | メンバーID |
| userId | S | GSI-PK | ユーザーID |
| historyType | S | GSI-SK | chronic/major_illness/hospitalization/surgery/allergy/side_effect |
| name | S | - | 病名・アレルギー名 |
| description | S | - | 詳細 |
| startDate | S | - | 発症日 |
| endDate | S | - | 完治日 |
| isCurrent | BOOL | - | 現在も継続中か |
| createdAt | S | - | 作成日時 |

**GSI: MemberHistory-index** (memberId, historyType)
**GSI: UserHistory-index** (userId, historyType)

### NutritionRecords テーブル

栄養管理情報を管理する。

| 属性名 | 型 | キー | 説明 |
|--------|------|------|------|
| nutritionId | S | PK | 記録ID (ULID) |
| userId | S | GSI-PK | ユーザーID |
| memberId | S | - | メンバーID |
| recordDate | S | GSI-SK | 記録日 (YYYY-MM-DD) |
| mealType | S | - | breakfast/lunch/dinner/snack |
| foodItems | L | - | 食品リスト [{name, calories, protein, fat, carbs}] |
| totalCalories | N | - | 合計カロリー |
| notes | S | - | メモ |
| createdAt | S | - | 作成日時 |

**GSI: UserNutrition-index** (userId, recordDate)

### ExerciseRecords テーブル

運動記録を管理する。

| 属性名 | 型 | キー | 説明 |
|--------|------|------|------|
| exerciseId | S | PK | 記録ID (ULID) |
| userId | S | GSI-PK | ユーザーID |
| exerciseType | S | - | walking/stretching/running |
| recordDate | S | GSI-SK | 記録日 (ISO 8601) |
| duration | N | - | 時間(分) |
| distance | N | - | 距離(m) |
| steps | N | - | 歩数 |
| notes | S | - | メモ |
| createdAt | S | - | 作成日時 |

**GSI: UserExercises-index** (userId, recordDate)

---

## API 設計 (API Gateway + Lambda)

全APIは `Authorization: Bearer <JWT>` ヘッダーによるCognito認証が必要。

### 認証 API

| メソッド | パス | 説明 | Lambda関数 |
|---------|------|------|-----------|
| POST | /auth/signup | 新規登録 | auth-signup |
| POST | /auth/signin | ログイン | auth-signin |
| POST | /auth/refresh | トークンリフレッシュ | auth-refresh |
| POST | /auth/forgot-password | パスワードリセット | auth-forgot-password |

### ユーザー API

| メソッド | パス | 説明 | Lambda関数 |
|---------|------|------|-----------|
| GET | /users/me | 自分のプロフィール取得 | users-getProfile |
| PUT | /users/me | プロフィール更新 | users-updateProfile |
| PUT | /users/me/character | キャラクター設定更新 | users-updateCharacter |

### メンバー API (家族・ペット)

| メソッド | パス | 説明 | Lambda関数 |
|---------|------|------|-----------|
| GET | /members | メンバー一覧取得 | members-list |
| POST | /members | メンバー登録 | members-create |
| GET | /members/{memberId} | メンバー詳細取得 | members-get |
| PUT | /members/{memberId} | メンバー更新 | members-update |
| DELETE | /members/{memberId} | メンバー削除 | members-delete |
| POST | /members/{memberId}/photo | プロフィール写真アップロード | members-uploadPhoto |

### お薬 API

| メソッド | パス | 説明 | Lambda関数 |
|---------|------|------|-----------|
| GET | /members/{memberId}/medications | お薬一覧取得 | medications-list |
| POST | /members/{memberId}/medications | お薬登録 | medications-create |
| GET | /medications/{medicationId} | お薬詳細取得 | medications-get |
| PUT | /medications/{medicationId} | お薬更新 | medications-update |
| DELETE | /medications/{medicationId} | お薬削除 | medications-delete |
| PUT | /medications/{medicationId}/stock | 残数更新 | medications-updateStock |

### スケジュール API

| メソッド | パス | 説明 | Lambda関数 |
|---------|------|------|-----------|
| GET | /schedules | スケジュール一覧取得 | schedules-list |
| POST | /schedules | スケジュール登録 | schedules-create |
| PUT | /schedules/{scheduleId} | スケジュール更新 | schedules-update |
| DELETE | /schedules/{scheduleId} | スケジュール削除 | schedules-delete |
| GET | /schedules/today | 今日のスケジュール取得 | schedules-getToday |

### 服薬記録 API

| メソッド | パス | 説明 | Lambda関数 |
|---------|------|------|-----------|
| POST | /records | 服薬記録登録 | records-create |
| GET | /records | 服薬記録一覧取得 | records-list |
| GET | /records/daily/{date} | 日別服薬記録取得 | records-getDaily |
| GET | /members/{memberId}/records | メンバー別服薬記録 | records-listByMember |

### かかりつけ病院 API

| メソッド | パス | 説明 | Lambda関数 |
|---------|------|------|-----------|
| GET | /hospitals | 病院一覧取得 | hospitals-list |
| POST | /hospitals | 病院登録 | hospitals-create |
| PUT | /hospitals/{hospitalId} | 病院更新 | hospitals-update |
| DELETE | /hospitals/{hospitalId} | 病院削除 | hospitals-delete |

### 通院・予約 API

| メソッド | パス | 説明 | Lambda関数 |
|---------|------|------|-----------|
| GET | /appointments | 予約一覧取得 | appointments-list |
| POST | /appointments | 予約登録 | appointments-create |
| PUT | /appointments/{appointmentId} | 予約更新 | appointments-update |
| DELETE | /appointments/{appointmentId} | 予約削除 | appointments-delete |
| GET | /appointments/upcoming | 今後の予約取得 | appointments-upcoming |

### 既往歴 API

| メソッド | パス | 説明 | Lambda関数 |
|---------|------|------|-----------|
| GET | /members/{memberId}/medical-history | 既往歴一覧取得 | medical-history-list |
| POST | /members/{memberId}/medical-history | 既往歴登録 | medical-history-create |
| PUT | /medical-history/{historyId} | 既往歴更新 | medical-history-update |
| DELETE | /medical-history/{historyId} | 既往歴削除 | medical-history-delete |

### 栄養管理 API

| メソッド | パス | 説明 | Lambda関数 |
|---------|------|------|-----------|
| GET | /nutrition | 栄養記録一覧取得 | nutrition-list |
| POST | /nutrition | 栄養記録登録 | nutrition-create |
| GET | /nutrition/daily/{date} | 日別栄養記録取得 | nutrition-getDaily |
| GET | /nutrition/suggestion | 今日の食事提案取得 | nutrition-suggest |

### 運動記録 API

| メソッド | パス | 説明 | Lambda関数 |
|---------|------|------|-----------|
| GET | /exercises | 運動記録一覧取得 | exercises-list |
| POST | /exercises | 運動記録登録 | exercises-create |
| GET | /exercises/daily/{date} | 日別運動記録取得 | exercises-getDaily |
| GET | /exercises/stats | 運動統計取得 | exercises-getStats |

---

## フロントエンド設計 (React/TypeScript)

### ページ構成

```
/                           → ダッシュボード（今日のスケジュール一覧）
/login                      → ログイン画面
/signup                     → 新規登録画面
/members                    → 家族・ペット一覧
/members/new                → メンバー新規登録
/members/:id                → メンバー詳細
/members/:id/medications    → お薬一覧
/members/:id/medications/new→ お薬新規登録
/members/:id/medical-history→ 既往歴一覧
/medications/:id            → お薬詳細・スケジュール設定
/schedules                  → スケジュール管理
/records                    → 服薬記録（カレンダー表示）
/records/:date              → 日別服薬記録
/hospitals                  → かかりつけ病院一覧
/hospitals/new              → 病院新規登録
/appointments               → 通院予定一覧
/appointments/new           → 予約新規登録
/nutrition                  → 栄養管理
/nutrition/record           → 食事記録
/exercises                  → 運動記録
/exercises/record           → 運動記録追加
/character                  → キャラクター設定
/settings                   → アプリ設定
/prn-medication             → 頓服薬記録（イレギュラー登録）
```

### コンポーネント設計

```
src/
├── components/
│   ├── common/              # 共通コンポーネント
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── DatePicker.tsx
│   │   ├── TimePicker.tsx
│   │   ├── Badge.tsx
│   │   ├── Toast.tsx
│   │   └── Loading.tsx
│   ├── layout/              # レイアウト
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   ├── Sidebar.tsx
│   │   └── PageContainer.tsx
│   ├── character/           # キャラクター関連
│   │   ├── CharacterAvatar.tsx
│   │   ├── CharacterSelector.tsx
│   │   ├── CharacterReaction.tsx
│   │   └── CharacterNotification.tsx
│   ├── medication/          # 服薬関連
│   │   ├── MedicationCard.tsx
│   │   ├── MedicationForm.tsx
│   │   ├── MedicationList.tsx
│   │   ├── StockIndicator.tsx
│   │   ├── PrnMedicationForm.tsx
│   │   └── ScheduleTimeline.tsx
│   ├── member/              # メンバー関連
│   │   ├── MemberCard.tsx
│   │   ├── MemberForm.tsx
│   │   ├── PetProfileCard.tsx
│   │   └── PhotoUploader.tsx
│   ├── medical/             # 医療関連
│   │   ├── MedicalHistoryForm.tsx
│   │   ├── HospitalCard.tsx
│   │   ├── AppointmentCard.tsx
│   │   └── VaccineTracker.tsx
│   ├── nutrition/           # 栄養関連
│   │   ├── NutritionChart.tsx
│   │   ├── MealRecordForm.tsx
│   │   └── FoodSuggestion.tsx
│   └── exercise/            # 運動関連
│       ├── ExerciseCard.tsx
│       ├── ExerciseForm.tsx
│       └── ExerciseStats.tsx
├── pages/                   # ページコンポーネント
├── hooks/                   # カスタムフック
│   ├── useAuth.ts
│   ├── useMedications.ts
│   ├── useSchedules.ts
│   ├── useNotification.ts
│   └── useCharacter.ts
├── stores/                  # 状態管理 (Zustand)
│   ├── authStore.ts
│   ├── characterStore.ts
│   └── notificationStore.ts
├── api/                     # API クライアント
│   ├── client.ts
│   ├── auth.ts
│   ├── members.ts
│   ├── medications.ts
│   ├── schedules.ts
│   ├── records.ts
│   ├── hospitals.ts
│   ├── appointments.ts
│   ├── nutrition.ts
│   └── exercises.ts
├── types/                   # 型定義
│   ├── user.ts
│   ├── member.ts
│   ├── medication.ts
│   ├── schedule.ts
│   ├── record.ts
│   ├── hospital.ts
│   ├── appointment.ts
│   ├── nutrition.ts
│   ├── exercise.ts
│   └── character.ts
├── utils/                   # ユーティリティ
│   ├── date.ts
│   ├── notification.ts
│   └── sound.ts
└── assets/
    ├── characters/          # キャラクター画像
    │   ├── dog/
    │   ├── cat/
    │   ├── rabbit/
    │   └── bird/
    └── sounds/              # キャラクター音声
        ├── dog/
        ├── cat/
        ├── rabbit/
        └── bird/
```

### 主要画面ワイヤーフレーム

#### ダッシュボード（ホーム画面）

```
┌──────────────────────────────┐
│  HealthFamily    [設定] [🔔]  │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │   🐈️ ミケ              │  │
│  │  「お薬の時間だにゃい！」│  │
│  └────────────────────────┘  │
│                              │
│  ── 今日の予定 ──            │
│  ┌────────────────────────┐  │
│  │ 08:00 💊 血圧の薬       │  │
│  │ [パパ] ✅ 服薬済み       │  │
│  ├────────────────────────┤  │
│  │ 12:00 💊 胃薬           │  │
│  │ [ママ] ⏰ あと30分      │  │
│  ├────────────────────────┤  │
│  │ 18:00 💊 フィラリア薬   │  │
│  │ [ポチ🐕] ⬜ 未服薬      │  │
│  └────────────────────────┘  │
│                              │
│  ── お知らせ ──              │
│  ⚠️ ママの胃薬 残り3日分     │
│  📅 ポチの狂犬病ワクチン 2/15│
│                              │
├──────────────────────────────┤
│ 🏠 ホーム │💊 お薬│📅 通院│👤 │
└──────────────────────────────┘
```

---

## バックエンド設計 (Lambda/TypeScript)

### Lambda 関数構成

各機能ドメインごとに Lambda 関数を分割し、単一責任の原則に従う。

```
backend/
├── src/
│   ├── functions/
│   │   ├── auth/
│   │   │   ├── signup.ts
│   │   │   ├── signin.ts
│   │   │   ├── refresh.ts
│   │   │   └── forgot-password.ts
│   │   ├── users/
│   │   │   ├── getProfile.ts
│   │   │   ├── updateProfile.ts
│   │   │   └── updateCharacter.ts
│   │   ├── members/
│   │   │   ├── list.ts
│   │   │   ├── create.ts
│   │   │   ├── get.ts
│   │   │   ├── update.ts
│   │   │   ├── delete.ts
│   │   │   └── uploadPhoto.ts
│   │   ├── medications/
│   │   │   ├── list.ts
│   │   │   ├── create.ts
│   │   │   ├── get.ts
│   │   │   ├── update.ts
│   │   │   ├── delete.ts
│   │   │   └── updateStock.ts
│   │   ├── schedules/
│   │   │   ├── list.ts
│   │   │   ├── create.ts
│   │   │   ├── update.ts
│   │   │   ├── delete.ts
│   │   │   └── getToday.ts
│   │   ├── records/
│   │   │   ├── create.ts
│   │   │   ├── list.ts
│   │   │   ├── getDaily.ts
│   │   │   └── listByMember.ts
│   │   ├── hospitals/
│   │   │   ├── list.ts
│   │   │   ├── create.ts
│   │   │   ├── update.ts
│   │   │   └── delete.ts
│   │   ├── appointments/
│   │   │   ├── list.ts
│   │   │   ├── create.ts
│   │   │   ├── update.ts
│   │   │   ├── delete.ts
│   │   │   └── upcoming.ts
│   │   ├── medical-history/
│   │   │   ├── list.ts
│   │   │   ├── create.ts
│   │   │   ├── update.ts
│   │   │   └── delete.ts
│   │   ├── nutrition/
│   │   │   ├── list.ts
│   │   │   ├── create.ts
│   │   │   ├── getDaily.ts
│   │   │   └── suggest.ts
│   │   ├── exercises/
│   │   │   ├── list.ts
│   │   │   ├── create.ts
│   │   │   ├── getDaily.ts
│   │   │   └── getStats.ts
│   │   └── notifications/
│   │       ├── processReminder.ts      # EventBridgeからトリガー
│   │       ├── checkMissedMedication.ts # 飲み忘れチェック
│   │       └── lowStockAlert.ts        # 残数アラート
│   ├── shared/
│   │   ├── dynamodb.ts         # DynamoDB クライアント
│   │   ├── response.ts         # APIレスポンスヘルパー
│   │   ├── validator.ts        # バリデーション
│   │   ├── auth-middleware.ts   # 認証ミドルウェア
│   │   └── types/              # 共通型定義
│   │       ├── api.ts
│   │       ├── dynamo.ts
│   │       └── events.ts
│   └── utils/
│       ├── ulid.ts             # ULID生成
│       ├── date.ts             # 日付ユーティリティ
│       └── notification.ts     # 通知ヘルパー
├── template.yaml               # SAM テンプレート
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### 通知処理フロー

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ EventBridge  │────▶│  Lambda      │────▶│    SNS       │
│ (毎分実行)   │     │processRemind │     │ (Push通知)    │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────┴───────┐
                     │  DynamoDB    │
                     │ (スケジュール  │
                     │  照合)       │
                     └──────────────┘

[通知フロー詳細]

1. EventBridge が毎分 processReminder Lambda を実行
2. 現在時刻に該当するスケジュールを DynamoDB から取得
3. 該当ユーザーに SNS 経由でプッシュ通知を送信
   → キャラクターが「にゃいにゃい」とお知らせ
4. 一定時間後、服薬記録がない場合 checkMissedMedication が実行
   → キャラクターが「びゃいびゃい」と再通知
5. lowStockAlert が毎日1回実行
   → 残数が閾値以下のお薬を検出し、病院予約リマインダーを通知
```

---

## 通知システム設計

### 通知種類

| 通知種類 | トリガー | キャラクター反応 | 優先度 |
|---------|---------|-----------------|-------|
| 服薬リマインダー | スケジュール時刻 | 「にゃいにゃい」(設定キャラの鳴き声) | 高 |
| 飲み忘れアラート | 服薬時刻超過15分後 | 「びゃいびゃい」(緊急鳴き声) | 最高 |
| 頓服薬服用可能通知 | 前回服用から指定時間経過 | 通常鳴き声 | 中 |
| 残数アラート | 残数が閾値以下 | 「病院行こうにゃい」 | 中 |
| 通院リマインダー | 予約日の前日/当日 | 「病院の日だにゃい」 | 高 |
| ワクチンリマインダー | 次回接種日の1週間前 | 「注射の日が近いにゃい」 | 中 |
| 健康診断リマインダー | 設定日の1週間前 | 「健康診断だにゃい」 | 中 |

### EventBridge スケジュール

| ルール名 | スケジュール | 対象Lambda |
|---------|------------|-----------|
| medication-reminder | rate(1 minute) | processReminder |
| missed-medication-check | rate(5 minutes) | checkMissedMedication |
| low-stock-check | cron(0 9 * * ? *) | lowStockAlert |
| appointment-reminder | cron(0 8 * * ? *) | appointmentReminder |

---

## キャラクターシステム

### キャラクター定義

| キャラクター | アイコン | 通常鳴き声 | 服薬通知 | 飲み忘れ通知 | 服薬完了 | 運動応援 |
|------------|---------|-----------|---------|------------|---------|---------|
| いぬ | 🐕 | わんわん | わんわん！お薬の時間だよ！ | きゃいんきゃいん！お薬忘れてるよ！ | わん！えらい！ | わんわん！すごいね！ |
| ねこ | 🐈️ | にゃいにゃい | にゃいにゃい！お薬の時間にゃ！ | びゃいびゃい！お薬飲んでにゃ！ | にゃ〜ん♪ | にゃいにゃい！頑張ったにゃ！ |
| うさぎ | 🐇 | ぴょんぴょん | ぴょんぴょん！お薬の時間だよ！ | ぶぅぶぅ！お薬忘れてるよ！ | ぴょん♪ | ぴょんぴょん！えらいね！ |
| インコ | 🦜 | ぴーぴー | ぴよぴよ！お薬の時間だよ！ | ぎゃーぎゃー！お薬飲んで！ | ぴー♪ | ぴよぴよ！すごい！ |

### キャラクターの感情状態

```typescript
type CharacterMood =
  | 'happy'       // 服薬完了・運動達成時
  | 'excited'     // 大きな達成時
  | 'normal'      // 通常状態
  | 'reminding'   // 服薬時間通知中
  | 'worried'     // 飲み忘れ検知時
  | 'sad'         // 長期間の飲み忘れ
  | 'cheering';   // 運動応援中
```

---

## ディレクトリ構成

```
HealthFamily/
├── README.md
├── docker-compose.yml
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # CI パイプライン
│   │   ├── deploy-staging.yml  # ステージングデプロイ
│   │   └── deploy-prod.yml     # 本番デプロイ
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature_request.md
│   │   ├── bug_report.md
│   │   └── task.md
│   └── PULL_REQUEST_TEMPLATE.md
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   ├── public/
│   │   └── manifest.json       # PWA マニフェスト
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── stores/
│       ├── api/
│       ├── types/
│       ├── utils/
│       └── assets/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       ├── functions/
│       ├── shared/
│       └── utils/
└── infrastructure/
    └── terraform/
        ├── main.tf                 # プロバイダ・バックエンド設定
        ├── versions.tf             # バージョン制約
        ├── variables.tf            # 変数定義
        ├── locals.tf               # ローカル変数
        ├── outputs.tf              # 出力定義
        ├── dynamodb.tf             # DynamoDB 10テーブル
        ├── cognito.tf              # Cognito認証基盤
        ├── lambda.tf               # Lambda関数定義
        ├── api_gateway.tf          # API Gateway REST API
        ├── lambda_permissions.tf   # Lambda呼び出し権限
        ├── s3.tf                   # S3バケット
        ├── sns.tf                  # SNSトピック
        ├── eventbridge.tf          # EventBridgeスケジュール
        ├── cloudfront.tf           # CloudFront CDN
        ├── iam.tf                  # IAMロール・ポリシー
        └── environments/
            ├── dev.tfvars          # 開発環境設定
            ├── staging.tfvars      # ステージング環境設定
            └── prod.tfvars         # 本番環境設定
```

---

## Terraform インフラ管理

### 概要

AWSサーバーレスアーキテクチャの全リソースをTerraformで管理しています。環境別（dev/staging/prod）のデプロイに対応し、S3バックエンドで状態管理を行います。

### 管理対象リソース

| リソース | 説明 | 数 |
|---------|------|-----|
| DynamoDB テーブル | 全データストア + GSI | 10テーブル |
| Lambda 関数 | API用 + 通知用 | 10関数 |
| API Gateway | REST API + Cognitoオーソライザー + CORS | 1 API |
| Cognito | User Pool + App Client | 1セット |
| S3 バケット | アセット + フロントエンド + Lambdaデプロイ | 3バケット |
| CloudFront | SPA配信 + APIプロキシ | 1ディストリビューション |
| EventBridge | 通知スケジュール | 4ルール |
| SNS | プッシュ通知 | 1トピック |
| IAM | Lambda実行ロール + ポリシー | 1ロール + 5ポリシー |

### Terraform 使用方法

```bash
cd infrastructure/terraform

# 初期化
terraform init

# 開発環境のプラン確認
terraform plan -var-file=environments/dev.tfvars

# 開発環境にデプロイ
terraform apply -var-file=environments/dev.tfvars

# ステージング環境にデプロイ
terraform apply -var-file=environments/staging.tfvars

# 本番環境にデプロイ
terraform apply -var-file=environments/prod.tfvars
```

### 環境別設定

| 環境 | PITR | 削除保護 | ログ保持 | スロットリング |
|------|------|---------|---------|-------------|
| dev | 無効 | 無効 | 7日 | 50 req/s |
| staging | 有効 | 無効 | 14日 | 100 req/s |
| prod | 有効 | 有効 | 90日 | 200 req/s |

### 状態管理ブートストラップ

初回のみ、Terraform状態管理用のS3バケットとDynamoDBロックテーブルを手動で作成する必要があります。

```bash
aws s3api create-bucket \
  --bucket healthfamily-terraform-state \
  --region ap-northeast-1 \
  --create-bucket-configuration LocationConstraint=ap-northeast-1

aws s3api put-bucket-versioning \
  --bucket healthfamily-terraform-state \
  --versioning-configuration Status=Enabled

aws dynamodb create-table \
  --table-name healthfamily-terraform-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-1
```

---

## 開発環境セットアップ

### 前提条件

- Node.js 20.x
- Docker / Docker Compose
- AWS CLI v2
- Terraform >= 1.6.0
- Git

### ローカル開発起動

```bash
# リポジトリクローン
git clone https://github.com/norman6464/HealthFamily.git
cd HealthFamily

# Docker で開発環境起動 (DynamoDB Local + フロントエンド + バックエンド)
docker compose up -d --build

# フロントエンド: http://localhost:5173
# バックエンドAPI: http://localhost:3001
# DynamoDB Local: http://localhost:8000
```

### Docker Compose 構成

| サービス | ポート | 説明 |
|---------|-------|------|
| frontend | 5173 | React 開発サーバー (Vite) |
| backend | 3001 | Lambda ローカルエミュレーション |
| dynamodb-local | 8000 | DynamoDB ローカル |
| dynamodb-admin | 8001 | DynamoDB 管理UI |

---

## 開発ルール

### ブランチ戦略

```
main (本番)
  └── develop (開発)
       ├── feature/機能名    # 新機能開発
       ├── fix/バグ名        # バグ修正
       └── docs/ドキュメント名 # ドキュメント更新
```

### コミットメッセージ規則

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル変更（動作に影響なし）
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・設定変更
```

例：
```
feat: 服薬スケジュール登録APIを追加
fix: 頓服薬の服用間隔計算の不具合を修正
docs: DynamoDBテーブル設計をREADMEに追加
```

### PR ルール

- PRタイトルはコミットメッセージ規則に従う
- PR本文には変更内容・影響範囲・テスト方法を記載
- レビュー承認後にマージ

### マイルストーン

| マイルストーン | 内容 | 目標 |
|--------------|------|------|
| v0.1.0 - 基盤構築 | プロジェクト構成・Docker環境・認証基盤 | Sprint 1 |
| v0.2.0 - コア機能 | メンバー管理・お薬管理・スケジュール管理 | Sprint 2 |
| v0.3.0 - 通知システム | 服薬リマインダー・飲み忘れ通知・残数アラート | Sprint 3 |
| v0.4.0 - 医療記録 | 通院管理・既往歴・ワクチン・かかりつけ病院 | Sprint 4 |
| v0.5.0 - ペット対応 | ペット登録・写真・ペット専用お薬カテゴリ | Sprint 5 |
| v0.6.0 - キャラクター | キャラクター選択・鳴き声・リアクション | Sprint 6 |
| v0.7.0 - 栄養・運動 | 栄養管理・運動記録・キャラクター応援 | Sprint 7 |
| v0.8.0 - 頓服薬対応 | イレギュラー登録・服用間隔管理 | Sprint 8 |
| v0.9.0 - 仕上げ | UI/UXブラッシュアップ・パフォーマンス最適化 | Sprint 9 |
| v1.0.0 - リリース | 本番デプロイ・最終テスト | Sprint 10 |
