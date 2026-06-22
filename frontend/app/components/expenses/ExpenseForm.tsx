import React, { useState } from "react";
import type { Member } from "@/lib/types";
import { ErrorText } from "@/components/ui";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

export { EXPENSE_CATEGORIES };

export interface ExpenseFormData {
  memberId: string | null;
  category: string;
  amount: number;
  description?: string;
  expenseDate: string;
  isDeductible: boolean;
}

export interface ExpenseFormInitialData {
  memberId: string | null;
  category: string;
  amount: number;
  description?: string | null;
  expenseDate: string;
  isDeductible: boolean;
}

interface ExpenseFormProps {
  members: Member[];
  onSubmit: (data: ExpenseFormData) => void;
  onCancel?: () => void;
  initialData?: ExpenseFormInitialData;
}

const toDateInput = (value: string | null | undefined): string => {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
};

const todayInput = (): string => new Date().toISOString().split("T")[0];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  members,
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [memberId, setMemberId] = useState<string>(initialData?.memberId ?? "");
  const [category, setCategory] = useState<string>(initialData?.category ?? "");
  const [amount, setAmount] = useState<string>(
    initialData ? String(initialData.amount) : "",
  );
  const [expenseDate, setExpenseDate] = useState<string>(
    initialData?.expenseDate ? toDateInput(initialData.expenseDate) : todayInput(),
  );
  const [isDeductible, setIsDeductible] = useState<boolean>(
    initialData ? initialData.isDeductible : true,
  );
  const [description, setDescription] = useState<string>(initialData?.description ?? "");

  const amountNumber = Number(amount);
  const isAmountValid = Number.isInteger(amountNumber) && amountNumber >= 1;
  const isValid = isAmountValid && category !== "" && expenseDate !== "";
  const showAmountError = amount !== "" && !isAmountValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onSubmit({
      memberId: memberId || null,
      category,
      amount: amountNumber,
      description: description.trim() || undefined,
      expenseDate,
      isDeductible,
    });

    if (!initialData) {
      setMemberId("");
      setCategory("");
      setAmount("");
      setExpenseDate(todayInput());
      setIsDeductible(true);
      setDescription("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="expense-member" className="block text-sm font-medium text-ink-700 mb-1">
          メンバー（任意）
        </label>
        <select
          id="expense-member"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">世帯全体</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="expense-category" className="block text-sm font-medium text-ink-700 mb-1">
          カテゴリ
        </label>
        <select
          id="expense-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        >
          <option value="">選択してください</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="expense-amount" className="block text-sm font-medium text-ink-700 mb-1">
          金額（円）
        </label>
        <input
          id="expense-amount"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
          placeholder="例: 1500"
        />
        {showAmountError && <ErrorText>金額は1円以上の整数で入力してください</ErrorText>}
      </div>

      <div>
        <label htmlFor="expense-date" className="block text-sm font-medium text-ink-700 mb-1">
          支出日
        </label>
        <input
          id="expense-date"
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="expense-deductible"
          type="checkbox"
          checked={isDeductible}
          onChange={(e) => setIsDeductible(e.target.checked)}
          className="h-4 w-4 rounded border-primary-300 text-primary focus:ring-primary"
        />
        <label htmlFor="expense-deductible" className="text-sm font-medium text-ink-700">
          医療費控除の対象
        </label>
      </div>

      <div>
        <label htmlFor="expense-description" className="block text-sm font-medium text-ink-700 mb-1">
          説明（任意）
        </label>
        <textarea
          id="expense-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={2}
          placeholder="例: 内科 初診料"
        />
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={!isValid}
          className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {initialData ? "更新する" : "登録する"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-primary-50 text-ink-700 py-2 px-4 rounded-lg hover:bg-primary-100 transition-colors font-medium"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};
