-- 旧Prisma時代に作成された本番テーブルは、@updatedAt がクライアント側更新のため
-- "updatedAt" に DB DEFAULT が存在しない (0001 の DEFAULT now() は既存テーブルに no-op)。
-- GORM モデルは `default:now()` タグにより INSERT 時に updatedAt を省略して DB 既定値に
-- 委ねるため、DEFAULT が無いと NOT NULL 制約違反 (SQLSTATE 23502) で新規作成が失敗する。
-- ALTER COLUMN SET DEFAULT は冪等 (毎起動の再実行で同値を再設定するだけ)。

ALTER TABLE "User"       ALTER COLUMN "updatedAt"  SET DEFAULT now();
ALTER TABLE "Member"     ALTER COLUMN "updatedAt"  SET DEFAULT now();
ALTER TABLE "Medication" ALTER COLUMN "updatedAt"  SET DEFAULT now();

-- 配列カラムの DEFAULT '{}' も同様に本番へ未反映だったため補正
ALTER TABLE "HealthLog"  ALTER COLUMN "symptoms"   SET DEFAULT '{}';
ALTER TABLE "Schedule"   ALTER COLUMN "daysOfWeek" SET DEFAULT '{}';
