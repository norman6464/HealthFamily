-- 予算のパーソナライズ拡張（カテゴリ別予算・アラート設定）とダッシュボード設定。既存DBに安全な no-op。

-- 既存 Budget にアラート設定と最終アラート月を追加
ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "alertEnabled" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "lastAlertedMonth" TEXT; -- "YYYY-MM"

-- カテゴリ別の月次予算
CREATE TABLE IF NOT EXISTS "CategoryBudget" (
    "id"            TEXT PRIMARY KEY,
    "userId"        TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "category"      TEXT NOT NULL,
    "monthlyAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("userId", "category")
);
CREATE INDEX IF NOT EXISTS "CategoryBudget_userId_idx" ON "CategoryBudget"("userId");

-- ダッシュボードのパーソナライズ設定（ユーザー単位）
CREATE TABLE IF NOT EXISTS "DashboardPreference" (
    "id"              TEXT PRIMARY KEY,
    "userId"          TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "hiddenCards"     TEXT[] NOT NULL DEFAULT '{}',
    "cardOrder"       TEXT[] NOT NULL DEFAULT '{}',
    "defaultMemberId" TEXT,
    "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
