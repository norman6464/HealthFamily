-- 発行済みトークンを利用者ごとに失効させるための版番号。
-- パスワード再設定で繰り上げ、トークンに載った値と食い違うものを拒む。
-- これが無いと、乗っ取られた利用者がパスワードを変えても
-- 攻撃者のトークンが有効期限(7日)まで通り続ける。
ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;
