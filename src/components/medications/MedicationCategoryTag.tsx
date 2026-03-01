'use client';

interface MedicationCategoryTagProps {
  category: string;
}

const categoryStyles: Record<string, string> = {
  '処方薬': 'bg-blue-100 text-blue-700',
  '市販薬': 'bg-green-100 text-green-700',
  'サプリメント': 'bg-purple-100 text-purple-700',
};

const defaultStyle = 'bg-gray-100 text-gray-700';

export function MedicationCategoryTag({ category }: MedicationCategoryTagProps) {
  const style = categoryStyles[category] ?? defaultStyle;

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {category}
    </span>
  );
}
