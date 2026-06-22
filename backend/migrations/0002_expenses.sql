-- 医療費・健康支出管理 (医療費控除対応)。既存DBに安全な no-op となるよう IF NOT EXISTS。
CREATE TABLE IF NOT EXISTS "Expense" (
    "id"           TEXT PRIMARY KEY,
    "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "memberId"     TEXT REFERENCES "Member"("id") ON DELETE SET NULL,
    "category"     TEXT NOT NULL,
    "amount"       INTEGER NOT NULL,
    "description"  TEXT,
    "expenseDate"  TIMESTAMPTZ NOT NULL,
    "isDeductible" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Expense_userId_idx" ON "Expense"("userId");
CREATE INDEX IF NOT EXISTS "Expense_memberId_idx" ON "Expense"("memberId");
CREATE INDEX IF NOT EXISTS "Expense_userId_expenseDate_idx" ON "Expense"("userId", "expenseDate");
