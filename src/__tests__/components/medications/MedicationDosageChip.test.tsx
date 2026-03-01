import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MedicationDosageChip } from '@/components/medications/MedicationDosageChip';

describe('MedicationDosageChip', () => {
  it('薬名と用量を表示する', () => {
    render(<MedicationDosageChip medicationName="頭痛薬" dosage="1錠" />);
    expect(screen.getByText('頭痛薬')).toBeInTheDocument();
    expect(screen.getByText('1錠')).toBeInTheDocument();
  });

  it('服用済みの場合にチェックマークが表示される', () => {
    const { container } = render(<MedicationDosageChip medicationName="薬A" dosage="2錠" isTaken={true} />);
    expect(container.querySelector('[class*="green"]')).toBeInTheDocument();
  });

  it('在庫少の場合に警告が表示される', () => {
    render(<MedicationDosageChip medicationName="薬B" dosage="1錠" isLowStock={true} />);
    expect(screen.getByText(/在庫少/)).toBeInTheDocument();
  });

  it('削除ボタンをクリックするとonRemoveが呼ばれる', () => {
    const onRemove = vi.fn();
    render(<MedicationDosageChip medicationName="薬C" dosage="3錠" onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(onRemove).toHaveBeenCalled();
  });

  it('onRemoveが未指定の場合は削除ボタンが表示されない', () => {
    render(<MedicationDosageChip medicationName="薬D" dosage="1錠" />);
    expect(screen.queryByLabelText('削除')).not.toBeInTheDocument();
  });
});
