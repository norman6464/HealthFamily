'use client';

import React, { useState } from 'react';
import { PackagePlus, X } from 'lucide-react';

interface StockRefillButtonProps {
  medicationId: string;
  currentStock: number;
  onRefill: (medicationId: string, newQuantity: number) => Promise<void>;
}

export const StockRefillButton: React.FC<StockRefillButtonProps> = ({ medicationId, currentStock, onRefill }) => {
  const [showInput, setShowInput] = useState(false);
  const [amount, setAmount] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRefill = async () => {
    const num = parseInt(amount, 10);
    if (isNaN(num) || num <= 0) return;
    setIsSubmitting(true);
    try {
      await onRefill(medicationId, currentStock + num);
      setShowInput(false);
      setAmount('30');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showInput) {
    return (
      <div className="flex items-center space-x-1">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
          min="1"
          aria-label="補充数"
        />
        <button
          onClick={handleRefill}
          disabled={isSubmitting}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          補充
        </button>
        <button
          onClick={() => setShowInput(false)}
          className="p-1 text-gray-400 hover:text-gray-600"
          aria-label="キャンセル"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
      aria-label="在庫補充"
    >
      <PackagePlus size={16} />
    </button>
  );
};
