# HealthFamily - 今お薬飲んでよ通知アプリ

> 家族もペットも、みんなの健康をキャラクターと一緒に守る服薬管理アプリ

---

## 目次

- [概要](#概要)
- [技術スタック](#技術スタック)
- [インフラ構成 (GCP)](#インフラ構成-gcp)
- [セットアップ](#セットアップ)
- [ターゲットユーザー](#ターゲットユーザー)

---

## 概要

**「今お薬飲んでよ通知アプリ」** は、自分だけでなく家族やペットの服薬を一括管理できるヘルスケアアプリケーションです。

設定したアテンドキャラクター（犬・猫・うさぎ・インコ）が服薬時間を可愛くお知らせし、飲み忘れ防止をサポートします。

**本番URL:** https://health-family-five.vercel.app

---

## 技術スタック

モノレポ構成。フロントエンドとバックエンドを分離しています。

| カテゴリ | 技術 | デプロイ |
|---------|------|---------|
| フロントエンド | React Router v7 (SPA) / TypeScript / Tailwind CSS / TanStack Query / Zustand / Zod / lucide-react | Vercel |
| バックエンド | Go / Gin / 生SQL (pgx) / クリーンアーキテクチャ / JWT | GCP Cloud Run |
| データベース | PostgreSQL | Supabase |
| CI/CD | GitHub Actions | — |

> 旧 Next.js 15 + Prisma + NextAuth 実装からリプレイス済み。

### アーキテクチャ

```
frontend/   React Router v7 (SPA)
  app/
    routes/        ページ（_authed レイアウト配下に主要画面）
    components/    機能別UIコンポーネント（shared 共通UI含む）
    lib/           api クライアント / 型 / 認証 / Character 設定
    stores/        Zustand ストア

backend/    Go / Gin / 生SQL / クリーンアーキテクチャ
  cmd/server/      エントリ（DI 組み立て）
  internal/
    domain/        エンティティ・リポジトリIF・ドメイン例外
    usecase/       ユースケース（所有権チェック等）
    infrastructure/ pgx・生SQLリポジトリ・起動時マイグレーション
    interface/     Ginハンドラ・ミドルウェア・ルーティング
    pkg/           auth(JWT/bcrypt) / mailer / response
  migrations/      *.sql（起動時に冪等適用）
```

詳細なデプロイ手順は [DEPLOY.md](DEPLOY.md) を参照。

---

## インフラ構成 (GCP)

プロジェクト: `healthfamily-prod` / リージョン: `asia-northeast1` (東京、Supabase (ap-northeast-1) と同居)

| サービス | 用途 | スペック / 設定 |
|---------|------|----------------|
| Cloud Run | Go API (`healthfamily-api`) の実行 | 256Mi メモリ / 1 vCPU / min 0〜max 2 インスタンス / リクエスト課金 (CPUはリクエスト処理中のみ割当) / 月200万リクエスト・18万vCPU秒の無料枠内で運用 |
| Cloud Build | `gcloud run deploy --source` のコンテナビルド | デフォルトプール / distroless マルチステージビルド (イメージ ~20MB) |
| Artifact Registry | コンテナイメージ保管 | `cloud-run-source-deploy` リポジトリ / 無料枠 0.5GB |
| Secret Manager | `DATABASE_URL` / `JWT_SECRET` / `RESEND_API_KEY` | 環境変数としてマウント / 無料枠 (6シークレットバージョン・月1万アクセス) |
| Workload Identity Federation | GitHub Actions からのキーレスデプロイ認証 | pool `github` / provider `github-provider` / `norman6464/HealthFamily` リポジトリ限定 |
| Cloud Billing 予算 | 課金の見張り | 月500円でアラート (50% / 90% / 100%) |

コールドスタート対策: GitHub Actions の keep-warm (10分毎 `/health` ping)。Go + distroless のためコールドスタート自体も1秒未満。

---

## セットアップ

### 前提条件

- Go 1.26 以上
- Node.js 20 以上
- PostgreSQL（ローカル or Supabase）

### バックエンド (:8080)

```bash
cd backend
cp .env.example .env   # DATABASE_URL / JWT_SECRET を設定
go run ./cmd/server
```

### フロントエンド (:5173)

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:8080
npm install && npm run dev
```

### テスト / ビルド

```bash
# backend
cd backend && go build ./... && go vet ./... && go test ./...

# frontend
cd frontend && npm run typecheck && npm run build
```

---

## ターゲットユーザー

### プライマリターゲット

| 対象 | 詳細 |
|------|------|
| 介護者の方 | 離れて暮らす祖父母・両親の服薬状況を見守りたい方 |
| 子育て世代 | 子どもの服薬・ワクチン管理をしたい保護者 |
| ペットオーナー | フィラリア・ノミダニ予防薬など、ペットの投薬管理が必要な方 |

### セカンダリターゲット

| 対象 | 詳細 |
|------|------|
| 健康意識が高い方 | サプリメント管理、栄養管理、運動管理をしたい方 |
| 頓服薬を使う方 | 頭痛薬など不定期な服薬の記録・間隔管理をしたい方 |
| 多頭飼いの飼い主 | 複数のペットの通院・投薬を管理したい方 |

