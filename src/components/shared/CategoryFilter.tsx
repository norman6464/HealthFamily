import React from 'react';
import { MedicationCategory, MedicationEntity } from '../../domain/entities/Medication';

interface CategoryFilterProps {
  selectedCategory: MedicationCategory | null;
  onSelect: (category: MedicationCategory | null) => void;
  availableCategories?: MedicationCategory[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelect,
  availableCategories,
}) => {
  const allCategories = MedicationEntity.getAllCategories();
  const categories = availableCategories
    ? allCategories.filter((c) => availableCategories.includes(c.id))
    : allCategories;

  if (categories.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3" role="tablist" aria-label="カテゴリフィルター">
      <button
        role="tab"
        aria-selected={selectedCategory === null}
        onClick={() => onSelect(null)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          selectedCategory === null
            ? 'bg-navy-700 text-white border border-navy-700'
            : 'bg-white text-navy-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        すべて
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={selectedCategory === cat.id}
          onClick={() => onSelect(cat.id)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedCategory === cat.id
              ? 'bg-navy-700 text-white border border-navy-700'
              : 'bg-white text-navy-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};
