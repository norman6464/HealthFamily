import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MedicationInteractionAlert } from '@/components/medications/MedicationInteractionAlert';

describe('MedicationInteractionAlert', () => {
  it('警告メッセージを表示する', () => {
    render(<MedicationInteractionAlert medicationNames={['薬A', '薬B']} message="同時服用に注意" />);
    expect(screen.getByText('同時服用に注意')).toBeInTheDocument();
  });

  it('対象の薬名を表示する', () => {
    render(<MedicationInteractionAlert medicationNames={['薬A', '薬B']} message="注意" />);
    expect(screen.getByText(/薬A/)).toBeInTheDocument();
    expect(screen.getByText(/薬B/)).toBeInTheDocument();
  });

  it('閉じるボタンをクリックするとonDismissが呼ばれる', () => {
    const onDismiss = vi.fn();
    render(<MedicationInteractionAlert medicationNames={['薬A']} message="注意" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('閉じる'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('onDismissが指定されない場合は閉じるボタンを表示しない', () => {
    render(<MedicationInteractionAlert medicationNames={['薬A']} message="注意" />);
    expect(screen.queryByLabelText('閉じる')).not.toBeInTheDocument();
  });

  it('警告アイコンが表示される', () => {
    const { container } = render(<MedicationInteractionAlert medicationNames={['薬A']} message="注意" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
