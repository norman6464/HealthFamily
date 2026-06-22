import React from "react";
import { TrendingUp, Wallet, ShieldCheck } from "lucide-react";
import type { ExpenseSummary } from "@/lib/types";
import { Card } from "@/components/ui";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EXPENSE_CATEGORIES } from "./ExpenseForm";

const DEDUCTION_THRESHOLD = 100000;

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c.label]),
);

const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

interface ExpenseSummaryCardProps {
  summary: ExpenseSummary | undefined;
  isLoading: boolean;
}

export const ExpenseSummaryCard: React.FC<ExpenseSummaryCardProps> = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <LoadingSpinner />
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <p className="text-sm text-ink-500">集計データがありません</p>
      </Card>
    );
  }

  const { year, total, deductibleTotal, byCategory } = summary;
  const reachedThreshold = deductibleTotal >= DEDUCTION_THRESHOLD;
  const progressRatio = Math.min(deductibleTotal / DEDUCTION_THRESHOLD, 1);
  const progressPercent = Math.round(progressRatio * 100);

  const categoryEntries = Object.entries(byCategory)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-ink-800">{year}年の集計</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-primary-50 p-3">
          <p className="flex items-center gap-1 text-xs text-ink-500">
            <Wallet size={12} className="text-primary" />
            合計
          </p>
          <p className="mt-1 text-lg font-bold text-ink-800">{currencyFormatter.format(total)}</p>
        </div>
        <div className="rounded-xl bg-accent-50 p-3">
          <p className="flex items-center gap-1 text-xs text-ink-500">
            <ShieldCheck size={12} className="text-accent" />
            控除対象合計
          </p>
          <p className="mt-1 text-lg font-bold text-ink-800">
            {currencyFormatter.format(deductibleTotal)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span className="flex items-center gap-1">
            <TrendingUp size={12} className="text-primary" />
            医療費控除ライン（{currencyFormatter.format(DEDUCTION_THRESHOLD)}）
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-400/10">
          <div
            className={`h-full rounded-full transition-all ${
              reachedThreshold ? "bg-accent" : "bg-primary"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {reachedThreshold ? (
          <p className="text-sm font-medium text-accent-700">
            控除対象見込み: {currencyFormatter.format(deductibleTotal - DEDUCTION_THRESHOLD)}
            （10万円超過分）
          </p>
        ) : (
          <p className="text-sm text-ink-600">
            あと{currencyFormatter.format(DEDUCTION_THRESHOLD - deductibleTotal)}で控除対象
          </p>
        )}
      </div>

      {categoryEntries.length > 0 && (
        <div className="space-y-1.5 border-t border-ink-400/10 pt-3">
          <p className="text-xs font-semibold text-ink-600">カテゴリ別内訳</p>
          <ul className="space-y-1">
            {categoryEntries.map(([category, value]) => (
              <li key={category} className="flex items-center justify-between text-sm">
                <span className="text-ink-600">{CATEGORY_LABELS[category] ?? category}</span>
                <span className="font-medium text-ink-800">{currencyFormatter.format(value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};
