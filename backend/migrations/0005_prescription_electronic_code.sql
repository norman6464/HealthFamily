-- 電子処方箋の引換番号/アクセスコードを処方箋に保持。既存DBに安全な no-op。
ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "electronicCode" TEXT;
