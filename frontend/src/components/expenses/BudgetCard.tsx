import React, { useMemo, useState } from "react";
import { PiggyBank, Pencil, Check, X, Bell, BellOff } from "lucide-react";
import type { Budget, CategoryBudget, ExpenseSummary } from "@/shared/api";
import { Card } from "@/shared/ui";
import { LoadingSpinner } from "@/shared/ui";
import { EXPENSE_CATEGORIES, getExpenseCategoryLabel } from "@/shared/config";
import { formatCurrency } from "@/shared/lib";

const MONTH_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export interface BudgetSavePayload {
  monthlyAmount: number;
  alertEnabled: boolean;
  categories: CategoryBudget[];
}

interface BudgetCardProps {
  budget: Budget | undefined;
  summary: ExpenseSummary | undefined;
  isLoading: boolean;
  onSave: (payload: BudgetSavePayload) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  summary,
  isLoading,
  onSave,
}) => {
  const monthly = budget?.monthlyAmount ?? 0;
  const alertEnabled = budget?.alertEnabled ?? false;

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(monthly));
  const [alert, setAlert] = useState(alertEnabled);
  // カテゴリ別予算の編集状態（カテゴリ値 -> 入力文字列）
  const [catValues, setCatValues] = useState<Record<string, string>>({});

  const budgetCatMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of budget?.categories ?? []) m.set(c.category, c.monthlyAmount);
    return m;
  }, [budget?.categories]);

  if (isLoading) {
    return (
      <Card>
        <LoadingSpinner />
      </Card>
    );
  }

  const startEdit = () => {
    setValue(String(monthly));
    setAlert(alertEnabled);
    const initial: Record<string, string> = {};
    for (const c of EXPENSE_CATEGORIES) {
      const amt = budgetCatMap.get(c.value) ?? 0;
      initial[c.value] = amt > 0 ? String(amt) : "";
    }
    setCatValues(initial);
    setEditing(true);
  };

  const save = () => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return;

    const categories: CategoryBudget[] = [];
    for (const c of EXPENSE_CATEGORIES) {
      const raw = catValues[c.value] ?? "";
      if (raw === "") continue;
      const cn = Number(raw);
      if (!Number.isFinite(cn) || cn <= 0) continue;
      categories.push({ category: c.value, monthlyAmount: Math.floor(cn) });
    }

    onSave({ monthlyAmount: Math.floor(n), alertEnabled: alert, categories });
    setEditing(false);
  };

  // 選択年の月別支出（summary.byMonth）。予算超過月を赤で示す。
  const byMonth = new Map<number, number>();
  for (const m of summary?.byMonth ?? []) byMonth.set(m.month, m.total);
  const maxSpend = Math.max(monthly, ...Array.from(byMonth.values()), 1);
  const annualBudget = monthly * 12;
  const annualSpent = summary?.total ?? 0;
  const annualRatio = annualBudget > 0 ? Math.min(annualSpent / annualBudget, 1) : 0;

  // カテゴリ別の年間使用額（summary.byCategory）
  const byCategory = summary?.byCategory ?? {};

  const categoryBudgets = budget?.categories ?? [];
  const hasCategoryBudgets = categoryBudgets.length > 0;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-base font-bold text-ink-800">
          <PiggyBank size={18} className="text-primary" />
          月次予算
        </h3>
        {!editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-500 transition hover:bg-ink-400/10 hover:text-ink-700"
          >
            <Pencil size={13} />
            {monthly > 0 || hasCategoryBudgets ? "変更" : "設定"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          {/* 総額の月次予算 */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-600">総額の月次予算</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-500">¥</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-36 rounded-xl border border-ink-400/30 bg-white px-3 py-2 text-sm text-ink-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
              <span className="text-sm text-ink-500">/ 月</span>
            </div>
          </div>

          {/* アラート有効トグル */}
          <button
            type="button"
            onClick={() => setAlert((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-ink-400/20 bg-white px-3 py-2 text-left transition hover:border-primary/40"
            aria-pressed={alert}
          >
            <span className="flex items-center gap-2 text-sm text-ink-700">
              {alert ? (
                <Bell size={15} className="text-primary" />
              ) : (
                <BellOff size={15} className="text-ink-400" />
              )}
              予算超過アラート
            </span>
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                alert ? "bg-primary" : "bg-ink-400/30"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  alert ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </span>
          </button>

          {/* カテゴリ別予算 */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-600">
              カテゴリ別予算（任意 / 月）
            </p>
            <div className="space-y-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <div key={c.value} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-ink-700">{c.label}</span>
                  <span className="text-sm text-ink-500">¥</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={catValues[c.value] ?? ""}
                    onChange={(e) =>
                      setCatValues((prev) => ({ ...prev, [c.value]: e.target.value }))
                    }
                    placeholder="0"
                    className="w-28 rounded-xl border border-ink-400/30 bg-white px-3 py-1.5 text-sm text-ink-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={save}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark"
            >
              <Check size={15} />
              保存
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 rounded-full bg-ink-400/10 px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-400/20"
            >
              <X size={15} />
              キャンセル
            </button>
          </div>
        </div>
      ) : monthly === 0 && !hasCategoryBudgets ? (
        <p className="text-sm text-ink-500">
          月次予算を設定すると、月別の医療費が予算内かどうかを可視化できます。
        </p>
      ) : (
        <>
          {monthly > 0 && (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-ink-800">
                  {formatCurrency(monthly)}
                </span>
                <span className="flex items-center gap-2 text-xs text-ink-500">
                  {alertEnabled ? (
                    <span className="flex items-center gap-1 text-primary">
                      <Bell size={12} />
                      アラートON
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-ink-400">
                      <BellOff size={12} />
                      アラートOFF
                    </span>
                  )}
                  <span>/ 月</span>
                </span>
              </div>

              {/* 年間予算の消化 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-ink-500">
                  <span>
                    {summary?.year}年の消化（年間予算 {formatCurrency(annualBudget)}）
                  </span>
                  <span>{Math.round(annualRatio * 100)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-400/10">
                  <div
                    className={`h-full rounded-full ${
                      annualSpent > annualBudget ? "bg-red-400" : "bg-primary"
                    }`}
                    style={{ width: `${Math.round(annualRatio * 100)}%` }}
                  />
                </div>
              </div>

              {/* 月別バー（予算超過は赤） */}
              <div>
                <p className="mb-1.5 text-xs font-semibold text-ink-600">
                  月別の支出（赤=予算超過）
                </p>
                <div className="flex items-end gap-1" style={{ height: 72 }}>
                  {MONTH_LABELS.map((label, i) => {
                    const spend = byMonth.get(i + 1) ?? 0;
                    const h = Math.round((spend / maxSpend) * 60);
                    const over = spend > monthly;
                    return (
                      <div key={label} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t ${over ? "bg-red-400" : "bg-primary/70"}`}
                          style={{ height: `${Math.max(h, spend > 0 ? 3 : 0)}px` }}
                          title={`${label}月: ${formatCurrency(spend)}`}
                        />
                        <span className="text-[9px] text-ink-400">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* カテゴリ別予算の一覧（今年の使用額を併記） */}
          {hasCategoryBudgets && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink-600">
                カテゴリ別予算（{summary?.year}年の使用額）
              </p>
              <div className="space-y-2">
                {categoryBudgets.map((cb) => {
                  const label = getExpenseCategoryLabel(cb.category);
                  const used = byCategory[cb.category] ?? 0;
                  // カテゴリ別の年間予算 = 月次 * 12
                  const annualCatBudget = cb.monthlyAmount * 12;
                  const ratio =
                    annualCatBudget > 0 ? Math.min(used / annualCatBudget, 1) : 0;
                  const over = annualCatBudget > 0 && used > annualCatBudget;
                  return (
                    <div key={cb.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-700">{label}</span>
                        <span className="text-ink-500">
                          {formatCurrency(used)} / {formatCurrency(annualCatBudget)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-400/10">
                        <div
                          className={`h-full rounded-full ${over ? "bg-red-400" : "bg-accent"}`}
                          style={{ width: `${Math.round(ratio * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};
