import { useMemo, useState } from "react";
import { ExpenseCreateForm, useDeleteExpense, useSaveBudget, useUpdateExpense } from "@/features/manage-expenses";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download, Plus, Upload, X } from "lucide-react";
import { api } from "@/shared/api";
import { queryKeys } from "@/shared/api";
import type { Member } from "@/shared/api";
import { SectionTitle } from "@/shared/ui";
import { MemberFilter } from "@/shared/ui";
import {
  ExpenseList,
  ExpenseSummaryCard,
  useExpenses,
  useExpenseSummary,
  type UpdateExpenseInput,
} from "@/entities/expense";
import { BudgetCard, useBudget, useBudgetAlert } from "@/entities/budget";
import { ExpenseImport } from "@/features/import-expenses";
import { downloadDeductionCsv } from "@/features/export-expenses-csv";
import { getExpenseCategoryLabel } from "@/shared/config";
import { formatCurrency } from "@/shared/lib";

const YEAR_OPTIONS_COUNT = 5;

export default function Expenses() {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState<number>(currentYear);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const yearOptions = useMemo(
    () => Array.from({ length: YEAR_OPTIONS_COUNT }, (_, i) => currentYear - i),
    [currentYear],
  );

  // TODO: entities/member スライスができ次第そちらへ移す(複数ページで共有される取得のため)
  const { data: members = [] } = useQuery({
    queryKey: queryKeys.members.all,
    queryFn: () => api.get<Member[]>("/members"),
  });

  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(
    year,
    selectedMemberId,
  );
  const { data: summary, isLoading: summaryLoading } = useExpenseSummary(year);
  const { data: budget, isLoading: budgetLoading } = useBudget();
  // ページ表示時に予算超過を判定（メールアラート連動）
  const { data: alertStatus } = useBudgetAlert();

  const saveBudgetMutation = useSaveBudget();
  const updateMutation = useUpdateExpense(year);
  const deleteMutation = useDeleteExpense(year);

  const handleUpdate = async (id: string, input: UpdateExpenseInput) => {
    await updateMutation.mutateAsync({ id, input });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleExportCsv = () => {
    downloadDeductionCsv(expenses, members, year);
  };

  const categoryLabel = getExpenseCategoryLabel;

  return (
    <div className="space-y-5">
      <SectionTitle accentColor="primary" size="lg">
        医療費・家計
      </SectionTitle>

      {alertStatus?.overBudget && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div className="space-y-1">
            <p className="text-sm font-bold">今月の医療費が予算を超えています</p>
            <p className="text-xs text-red-600">
              今月の支出 {formatCurrency(alertStatus.monthTotal)} / 予算{" "}
              {formatCurrency(alertStatus.monthlyAmount)}
            </p>
            {alertStatus.overCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {alertStatus.overCategories.map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700"
                  >
                    {categoryLabel(cat)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label htmlFor="expense-year" className="text-sm font-medium text-ink-600">
          対象年
        </label>
        <select
          id="expense-year"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-xl border border-primary-200 bg-white px-3 py-1.5 text-sm text-ink-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}年
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowImport(true)}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition hover:bg-primary-100"
          title="医療費CSVを取り込む"
        >
          <Upload size={16} />
          CSV取込
        </button>
        <button
          onClick={handleExportCsv}
          disabled={expenses.length === 0}
          className="flex items-center gap-1.5 rounded-xl bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition hover:bg-primary-100 disabled:opacity-50"
          title="医療費控除の明細書(CSV)をダウンロード"
        >
          <Download size={16} />
          明細書CSV
        </button>
      </div>

      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-0 sm:items-center sm:p-4"
          onClick={() => setShowImport(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-t-2xl bg-white p-5 shadow-card sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-800">医療費CSV取込</h3>
              <button
                onClick={() => setShowImport(false)}
                className="rounded-lg p-1 text-ink-500 transition hover:bg-ink-400/10"
                aria-label="閉じる"
              >
                <X size={18} />
              </button>
            </div>
            <ExpenseImport year={year} />
          </div>
        </div>
      )}

      <ExpenseSummaryCard summary={summary} isLoading={summaryLoading} />

      <BudgetCard
        budget={budget}
        summary={summary}
        isLoading={budgetLoading}
        onSave={(payload) => saveBudgetMutation.mutate(payload)}
      />

      <MemberFilter
        members={members}
        selectedMemberId={selectedMemberId}
        onSelect={setSelectedMemberId}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-ink-800">支出記録</h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          aria-label={showForm ? "閉じる" : "支出を追加"}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          <span>{showForm ? "閉じる" : "追加"}</span>
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm">
          <ExpenseCreateForm
            members={members}
            year={year}
            onCreated={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <ExpenseList
        items={expenses}
        members={members}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isLoading={expensesLoading}
      />
    </div>
  );
}
