import React from 'react';
import { Package, Plus } from 'lucide-react';

export interface StockCheckItem {
  medicationId: string;
  medicationName: string;
  stockQuantity: number;
  memberName: string;
}

interface QuickStockCheckCardProps {
  items: StockCheckItem[];
  onRefill?: (medicationId: string) => void;
}

export const QuickStockCheckCard: React.FC<QuickStockCheckCardProps> = ({ items, onRefill }) => {
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center space-x-2 mb-3">
        <Package size={16} className="text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-700">在庫不足</h3>
        <span className="text-xs text-gray-400">{items.length}件</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.medicationId} className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-800 truncate">{item.medicationName}</p>
              <p className="text-xs text-gray-400">{item.memberName} / 残り{item.stockQuantity}</p>
            </div>
            {onRefill && (
              <button
                onClick={() => onRefill(item.medicationId)}
                className="ml-2 p-1 text-gray-400 hover:text-primary-600 transition-colors"
                aria-label="補充"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
