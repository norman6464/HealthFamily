-- 医療費の月次予算（ユーザー単位のパーソナライズ設定）。既存DBに安全な no-op。
CREATE TABLE IF NOT EXISTS "Budget" (
    "id"            TEXT PRIMARY KEY,
    "userId"        TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "monthlyAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
