import React from "react";
import {
  MEDICATION_CATEGORY_LABELS,
  type MedicationCategory,
} from "@/lib/categories";

export type { MedicationCategory };

export function getAllMedicationCategories(): Array<{ id: MedicationCategory; label: string }> {
  return (
    Object.entries(MEDICATION_CATEGORY_LABELS) as Array<[MedicationCategory, string]>
  ).map(([id, label]) => ({ id, label }));
}

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
  const allCategories = getAllMedicationCategories();
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
            ? "bg-primary-700 text-white border border-primary-700"
            : "bg-white text-ink-700 border border-primary-200 hover:bg-primary-50"
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
              ? "bg-primary-700 text-white border border-primary-700"
              : "bg-white text-ink-700 border border-primary-200 hover:bg-primary-50"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};
