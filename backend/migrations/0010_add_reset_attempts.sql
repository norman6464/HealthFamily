-- 再設定コードの総当たり対策。メール認証の試行回数とは別に数える。
-- 片方への攻撃で、もう片方まで本人が使えなくなるのを避けるため列を分ける。
ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "resetAttempts" INTEGER NOT NULL DEFAULT 0;
