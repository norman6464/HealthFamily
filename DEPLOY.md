# HealthFamily 構成 & デプロイ

バックエンドは **GCP Cloud Run**、フロントエンドは **Vercel**、DBは **Supabase(PostgreSQL, 東京)** で運用する。
（Render → 2026-07 に Cloud Run へ移行。2026-08 に DB・API とも東京リージョンへ移設し、
`asia-northeast1` / Supabase `ap-northeast-1` で同居させている）

## ディレクトリ

```
backend/    Go / Gin / 生SQL / クリーンアーキテクチャ (REST API)
  cmd/server/main.go              エントリ (DI 組み立て)
  internal/
    domain/        エンティティ・リポジトリIF・ドメイン例外
    usecase/       ユースケース (所有権チェック等のビジネスロジック)
    infrastructure/
      database/    pgx プール + 起動時マイグレーション
      persistence/ 生SQL リポジトリ実装
    interface/
      handler/     Gin ハンドラ
      middleware/  JWT認証 / レート制限 / CORS
      router/      ルーティング
    pkg/           auth(JWT/bcrypt/ID) / mailer / response
  migrations/      *.sql (起動時に冪等適用)
  Dockerfile       Cloud Run 用マルチステージビルド (distroless)
frontend/   React Router v7 (SPA, ssr:false) + TanStack Query + Tailwind → Vercel
```

## ローカル開発

```bash
# バックエンド
cd backend
cp .env.example .env   # DATABASE_URL / JWT_SECRET を設定
go run ./cmd/server    # :8080

# フロントエンド
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:8080
npm install && npm run dev   # :5173
```

## 本番構成 (Cloud Run)

- サービス: `healthfamily-api` / プロジェクト: `healthfamily-prod` / リージョン: `asia-northeast1` (Supabase 東京と同居)
- URL: https://healthfamily-api-554199866293.asia-northeast1.run.app
- スケール: min 0 / max 2、256Mi / 1vCPU、リクエスト課金 → 無料枠内 (月200万リクエスト・vCPU 18万秒)
- コールドスタート対策: `.github/workflows/keep-warm.yml` が10分毎に `/health` を ping
  (Go + distroless でコールドスタート自体も1秒未満)
- 環境変数: `MIGRATIONS_DIR` / `MAIL_FROM` / `ALLOWED_ORIGINS` / `GOOGLE_CLIENT_ID` は平文 env、
  `DATABASE_URL` / `JWT_SECRET` / `RESEND_API_KEY` は **Secret Manager** 参照
- マイグレーションは `MIGRATIONS_DIR=migrations` により起動時に自動適用 (冪等)

### デプロイ (CD)

main への push (`backend/**` 変更時) で `.github/workflows/deploy-backend.yml` が
Workload Identity Federation (キーレス) で認証し `gcloud run deploy --source backend` を実行する。

手動デプロイ:

```bash
gcloud run deploy healthfamily-api \
  --source backend \
  --region asia-northeast1 \
  --project healthfamily-prod \
  --allow-unauthenticated
```

### 運用コマンド

```bash
gcloud run services describe healthfamily-api --region asia-northeast1 --project healthfamily-prod   # 状態/URL確認
gcloud run services logs read healthfamily-api --region asia-northeast1 --project healthfamily-prod  # ログ
gcloud run revisions list --service healthfamily-api --region asia-northeast1 --project healthfamily-prod
```

## フロントエンド (Vercel)

- `frontend/` を Vercel が自動デプロイ (main push)
- `VITE_API_URL` に Cloud Run のURLを設定 (ビルド時に焼き込み)。変更時は再デプロイが必要

## DB (Supabase)

- プロジェクト: `healthfamily-prod` (ref `mrpilmpkeepulopttwcp` / `ap-northeast-1` 東京 / PostgreSQL 17.6)
- 接続: session pooler (`:5432`)。pgx の prepared statement 互換のため transaction pooler (`:6543`) は使わない
  - ホスト: `aws-0-ap-northeast-1.pooler.supabase.com` / ユーザー: `postgres.mrpilmpkeepulopttwcp`
  - Direct 接続 (`db.<ref>.supabase.co`) は IPv6 専用のため Cloud Run からは使えない
- Supabase Auth / Storage は未使用。素の PostgreSQL としてのみ利用している
- スキーマは `backend/migrations/*.sql` が唯一の情報源で、起動時に冪等適用される
