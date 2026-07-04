-- 本番DBは旧Prisma時代に作成されたテーブルを引き継いでおり、
-- 0001 の CREATE TABLE IF NOT EXISTS は既存テーブルに対して no-op になる。
-- そのため 0001 に後から追記されたカラムが本番に存在しない (SQLSTATE 42703)。
-- 不足カラムはここで ALTER TABLE により補う。

-- Medication.status: 服用状況 (active / paused / discontinued)
-- カラム新設時のみ、既存の isActive=FALSE を paused として引き継ぐ
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Medication' AND column_name = 'status'
    ) THEN
        ALTER TABLE "Medication" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
        UPDATE "Medication" SET "status" = 'paused' WHERE "isActive" = FALSE;
    END IF;
END $$;

-- Examination.imageData: 検査画像 (base64)
ALTER TABLE "Examination" ADD COLUMN IF NOT EXISTS "imageData" TEXT;
