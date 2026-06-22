import React, { useState } from "react";
import { PiggyBank, Pencil, Check, X } from "lucide-react";
import type { Budget, ExpenseSummary } from "@/lib/types";
import { Card } from "@/components/ui";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const currency = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const MONTH_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

interface BudgetCardProps {
  budget: Budget | undefined;
  summary: ExpenseSummary | undefined;
  isLoading: boolean;
  onSave: (monthlyAmount: number) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  summary,
  isLoading,
  onSave,
}) => {
  const monthly = budget?.monthlyAmount ?? 0;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(monthly));

  if (isLoading) {
    return (
      <Card>
        <LoadingSpinner />
      </Card>
    );
  }

  const startEdit = () => {
    setValue(String(monthly));
    setEditing(true);
  };

  const save = () => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return;
    onSave(Math.floor(n));
    setEditing(false);
  };

  // 選択年の月別支出（summary.byMonth）。予算超過月を赤で示す。
  const byMonth = new Map<number, number>();
  for (const m of summary?.byMonth ?? []) byMonth.set(m.month, m.total);
  const maxSpend = Math.max(monthly, ...Array.from(byMonth.values()), 1);
  const annualBudget = monthly * 12;
  const annualSpent = summary?.total ?? 0;
  const annualRatio = annualBudget > 0 ? Math.min(annualSpent / annualBudget, 1) : 0;

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
            {monthly > 0 ? "変更" : "設定"}
          </button>
        )}
      </div>

      {editing ? (
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
          <button
            onClick={save}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark"
            aria-label="保存"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-400/10 text-ink-600 hover:bg-ink-400/20"
            aria-label="キャンセル"
          >
            <X size={16} />
          </button>
        </div>
      ) : monthly === 0 ? (
        <p className="text-sm text-ink-500">
          月次予算を設定すると、月別の医療費が予算内かどうかを可視化できます。
        </p>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-ink-800">{currency.format(monthly)}</span>
            <span className="text-xs text-ink-500">/ 月</span>
          </div>

          {/* 年間予算の消化 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-ink-500">
              <span>{summary?.year}年の消化（年間予算 {currency.format(annualBudget)}）</span>
              <span>{Math.round(annualRatio * 100)}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-400/10">
              <div
                className={`h-full rounded-full ${annualSpent > annualBudget ? "bg-red-400" : "bg-primary"}`}
                style={{ width: `${Math.round(annualRatio * 100)}%` }}
              />
            </div>
          </div>

          {/* 月別バー（予算超過は赤） */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-600">月別の支出（赤=予算超過）</p>
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
                      title={`${label}月: ${currency.format(spend)}`}
                    />
                    <span className="text-[9px] text-ink-400">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
