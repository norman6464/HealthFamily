-- Google OIDC ログイン用。Google の subject (安定ID) を保持する。
-- NULL 許容 (メール/パスワードのみのユーザーは NULL)。UNIQUE インデックスは
-- PostgreSQL では NULL 同士を重複とみなさないため部分インデックス不要。
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User" ("googleId");
