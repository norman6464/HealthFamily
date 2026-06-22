import React, { useMemo, useState } from "react";
import { Pencil, Trash2, Calendar, ShieldCheck } from "lucide-react";
import type { Expense, Member } from "@/lib/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyStatePrompt } from "@/components/shared/EmptyStatePrompt";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { ExpenseForm, EXPENSE_CATEGORIES, type ExpenseFormData } from "./ExpenseForm";

export interface UpdateExpenseInput {
  memberId?: string | null;
  category?: string;
  amount?: number;
  description?: string | null;
  expenseDate?: string;
  isDeductible?: boolean;
}

interface ExpenseListProps {
  items: Expense[];
  members: Member[];
  onUpdate: (id: string, input: UpdateExpenseInput) => Promise<void>;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c.label]),
);

const CATEGORY_CHIP: Record<string, string> = {
  medication: "bg-primary-50 text-primary-700",
  hospital: "bg-accent-50 text-accent-700",
  pharmacy: "bg-teal-50 text-teal-700",
  insurance: "bg-amber-50 text-amber-700",
  checkup: "bg-sky-50 text-sky-700",
  pet: "bg-rose-50 text-rose-700",
  transport: "bg-indigo-50 text-indigo-700",
  other: "bg-ink-400/10 text-ink-600",
};

const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const formatDateJP = (value: string): string =>
  new Date(value).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

const monthKey = (value: string): string => {
  const d = new Date(value);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
};

export const ExpenseList: React.FC<ExpenseListProps> = ({
  items,
  members,
  onUpdate,
  onDelete,
  isLoading,
}) => {
  const memberName = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.id, m.name));
    return (memberId: string | null): string =>
      memberId ? (map.get(memberId) ?? "不明なメンバー") : "世帯";
  }, [members]);

  const groups = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime(),
    );
    const result: { key: string; expenses: Expense[] }[] = [];
    for (const expense of sorted) {
      const key = monthKey(expense.expenseDate);
      const last = result[result.length - 1];
      if (last && last.key === key) {
        last.expenses.push(expense);
      } else {
        result.push({ key, expenses: [expense] });
      }
    }
    return result;
  }, [items]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (items.length === 0) {
    return (
      <EmptyStatePrompt
        message="支出記録がありません"
        subMessage="「追加」ボタンから医療費・健康支出を登録できます"
      />
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const monthTotal = group.expenses.reduce((sum, e) => sum + e.amount, 0);
        return (
          <div key={group.key} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-ink-700">{group.key}</h3>
              <span className="text-xs text-ink-500">{currencyFormatter.format(monthTotal)}</span>
            </div>
            {group.expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                members={members}
                memberLabel={memberName(expense.memberId)}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

interface ExpenseCardProps {
  expense: Expense;
  members: Member[];
  memberLabel: string;
  onUpdate: (id: string, input: UpdateExpenseInput) => Promise<void>;
  onDelete: (id: string) => void;
}

const ExpenseCard: React.FC<ExpenseCardProps> = React.memo(
  ({ expense, members, memberLabel, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const categoryLabel = CATEGORY_LABELS[expense.category] ?? expense.category;
    const chipClass = CATEGORY_CHIP[expense.category] ?? CATEGORY_CHIP.other;

    const handleUpdate = async (data: ExpenseFormData) => {
      await onUpdate(expense.id, {
        memberId: data.memberId,
        category: data.category,
        amount: data.amount,
        description: data.description ?? null,
        expenseDate: data.expenseDate,
        isDeductible: data.isDeductible,
      });
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-primary-200">
          <ExpenseForm
            members={members}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            initialData={{
              memberId: expense.memberId,
              category: expense.category,
              amount: expense.amount,
              description: expense.description,
              expenseDate: expense.expenseDate,
              isDeductible: expense.isDeductible,
            }}
          />
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm p-3 border border-primary-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${chipClass}`}>
                {categoryLabel}
              </span>
              <span className="text-xs bg-primary-50 text-ink-600 px-1.5 py-0.5 rounded">
                {memberLabel}
              </span>
              {expense.isDeductible && (
                <span className="inline-flex items-center gap-0.5 text-xs bg-accent-50 text-accent-700 px-1.5 py-0.5 rounded">
                  <ShieldCheck size={10} />
                  控除対象
                </span>
              )}
            </div>
            <p className="mt-1.5 text-base font-bold text-ink-800">
              {currencyFormatter.format(expense.amount)}
            </p>
            <div className="text-xs text-ink-500 mt-1 space-y-0.5">
              <p className="flex items-center space-x-1">
                <Calendar size={10} />
                <span>{formatDateJP(expense.expenseDate)}</span>
              </p>
              {expense.description && <p className="text-ink-400">{expense.description}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="text-ink-400 hover:text-primary-500 p-1 transition-colors"
              aria-label="編集"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-ink-400 hover:text-red-500 p-1 transition-colors"
              aria-label="削除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <ConfirmationDialog
          title="支出記録の削除"
          message={`${categoryLabel}（${currencyFormatter.format(expense.amount)}）を削除しますか？この操作は取り消せません。`}
          isOpen={isDeleteDialogOpen}
          onConfirm={() => {
            setIsDeleteDialogOpen(false);
            onDelete(expense.id);
          }}
          onCancel={() => setIsDeleteDialogOpen(false)}
          isDangerous
        />
      </div>
    );
  },
);

ExpenseCard.displayName = "ExpenseCard";
