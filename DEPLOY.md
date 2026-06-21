# HealthFamily リプレイス版 構成 & デプロイ

Next.js → **React Router(SPA)** / Prisma → **Go(Gin) + 生SQL(pgx) クリーンアーキテクチャ** へ移行し、両方を **Render** にデプロイする。

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
frontend/   React Router v7 (SPA, ssr:false) + TanStack Query + Tailwind
render.yaml Blueprint (API + 静的サイト + Postgres)
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

## Render デプロイ（Blueprint 推奨）

Render CLI は新規サービス作成に未対応（`render blueprints validate` と既存リソース操作のみ）。
そのため **Blueprint(render.yaml)** で API + 静的サイト + Postgres を一括作成する。

1. `render.yaml` を含むブランチを GitHub に push
2. Render ダッシュボード **New ▸ Blueprint** → リポジトリを選択して取り込み（3リソース作成）
3. 作成後、相互の URL を環境変数に設定:
   - `healthfamily-api` の `ALLOWED_ORIGINS` = 静的サイトURL (例 `https://healthfamily-web.onrender.com`)
   - `healthfamily-web` の `VITE_API_URL` = APIのURL (例 `https://healthfamily-api.onrender.com`)
4. 以降のデプロイ確認・ログは CLI で:
   ```bash
   render services                 # 一覧/ID確認
   render deploys create <id>      # 手動デプロイ
   render logs --resources <id> --tail
   render psql <db-id>             # DB接続
   ```

`DATABASE_URL` は Blueprint が自動配線、`JWT_SECRET` は `generateValue` で自動生成、
マイグレーションは `MIGRATIONS_DIR=migrations` により起動時に自動適用される。
