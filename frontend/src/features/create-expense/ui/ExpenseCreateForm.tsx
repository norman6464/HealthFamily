import React from "react";
import type { Member } from "@/shared/api";
import { ExpenseForm, type ExpenseFormData } from "@/entities/expense";
import { useCreateExpense } from "../api/useCreateExpense";

interface ExpenseCreateFormProps {
  members: Member[];
  /** 無効化対象の表示中の年 */
  year: number;
  onCreated: () => void;
  onCancel: () => void;
}

export const ExpenseCreateForm: React.FC<ExpenseCreateFormProps> = ({
  members,
  year,
  onCreated,
  onCancel,
}) => {
  const createMutation = useCreateExpense(year);

  const handleSubmit = async (data: ExpenseFormData) => {
    await createMutation.mutateAsync(data);
    onCreated();
  };

  return <ExpenseForm members={members} onSubmit={handleSubmit} onCancel={onCancel} />;
};
