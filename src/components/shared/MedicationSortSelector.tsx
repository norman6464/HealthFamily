import React from 'react';

export type MedicationSortKey = 'name' | 'category' | 'stock';

interface MedicationSortSelectorProps {
  value: MedicationSortKey;
  onChange: (key: MedicationSortKey) => void;
}

const sortOptions: { key: MedicationSortKey; label: string }[] = [
  { key: 'name', label: '名前順' },
  { key: 'category', label: 'カテゴリ順' },
  { key: 'stock', label: '在庫順' },
];

export const MedicationSortSelector: React.FC<MedicationSortSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="flex space-x-1 mb-3">
      {sortOptions.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            value === opt.key
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
