import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Expense, ExpenseSummary, Member } from "@/lib/types";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { MemberFilter } from "@/components/shared/MemberFilter";
import { ExpenseForm, type ExpenseFormData } from "@/components/expenses/ExpenseForm";
import {
  ExpenseList,
  type UpdateExpenseInput,
} from "@/components/expenses/ExpenseList";
import { ExpenseSummaryCard } from "@/components/expenses/ExpenseSummaryCard";

const YEAR_OPTIONS_COUNT = 5;

export default function Expenses() {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState<number>(currentYear);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const yearOptions = useMemo(
    () => Array.from({ length: YEAR_OPTIONS_COUNT }, (_, i) => currentYear - i),
    [currentYear],
  );

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: () => api.get<Member[]>("/members"),
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", year, selectedMemberId],
    queryFn: () => {
      const params = new URLSearchParams({ year: String(year) });
      if (selectedMemberId) params.set("memberId", selectedMemberId);
      return api.get<Expense[]>(`/expenses?${params.toString()}`);
    },
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["expenses", "summary", year],
    queryFn: () => api.get<ExpenseSummary>(`/expenses/summary?year=${year}`),
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["expenses", "summary", year] });
  };

  const createMutation = useMutation({
    mutationFn: (data: ExpenseFormData) => api.post<Expense>("/expenses", data),
    onSuccess: invalidateAll,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExpenseInput }) =>
      api.patch<Expense>(`/expenses/${id}`, input),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: invalidateAll,
  });

  const handleCreate = async (data: ExpenseFormData) => {
    await createMutation.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (id: string, input: UpdateExpenseInput) => {
    await updateMutation.mutateAsync({ id, input });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-5">
      <SectionTitle accentColor="primary" size="lg">
        医療費・家計
      </SectionTitle>

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
      </div>

      <ExpenseSummaryCard summary={summary} isLoading={summaryLoading} />

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
          <ExpenseForm
            members={members}
            onSubmit={handleCreate}
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
