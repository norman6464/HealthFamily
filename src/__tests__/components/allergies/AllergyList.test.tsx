import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AllergyList } from '@/components/allergies/AllergyList';
import { Allergy } from '@/domain/entities/Allergy';

const createAllergy = (overrides: Partial<Allergy> = {}): Allergy => ({
  id: 'allergy-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  allergenName: 'ピーナッツ',
  allergyType: 'food',
  severity: 'severe',
  symptoms: 'アナフィラキシー',
  diagnosedAt: new Date('2024-05-01'),
  notes: 'エピペン携帯',
  createdAt: new Date(),
  ...overrides,
});

describe('AllergyList', () => {
  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('読み込み中を表示する', () => {
    render(<AllergyList allergies={[]} isLoading={true} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('空状態を表示する', () => {
    render(<AllergyList allergies={[]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('アレルギーが登録されていません')).toBeInTheDocument();
  });

  it('アレルギー情報を表示する', () => {
    const allergy = createAllergy();
    render(<AllergyList allergies={[allergy]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('ピーナッツ')).toBeInTheDocument();
    expect(screen.getByText('重度')).toBeInTheDocument();
    expect(screen.getByText('食物')).toBeInTheDocument();
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText('アナフィラキシー')).toBeInTheDocument();
    expect(screen.getByText('エピペン携帯')).toBeInTheDocument();
  });

  it('重症度バッジの色分けを表示する', () => {
    const mild = createAllergy({ id: 'a1', severity: 'mild' });
    const moderate = createAllergy({ id: 'a2', severity: 'moderate' });
    const severe = createAllergy({ id: 'a3', severity: 'severe' });
    const { rerender } = render(<AllergyList allergies={[mild]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('軽度')).toBeInTheDocument();

    rerender(<AllergyList allergies={[moderate]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('中度')).toBeInTheDocument();

    rerender(<AllergyList allergies={[severe]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('重度')).toBeInTheDocument();
  });

  it('アレルギー種類ラベルを表示する', () => {
    const types = [
      { type: 'food', label: '食物' },
      { type: 'medication', label: '薬物' },
      { type: 'environmental', label: '環境' },
      { type: 'pollen', label: '花粉' },
      { type: 'atopy', label: 'アトピー' },
      { type: 'other', label: 'その他' },
    ];
    for (const { type, label } of types) {
      const allergy = createAllergy({ allergyType: type });
      const { unmount } = render(<AllergyList allergies={[allergy]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it('診断日を表示する', () => {
    const allergy = createAllergy({ diagnosedAt: new Date('2024-05-01') });
    render(<AllergyList allergies={[allergy]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText(/2024\/5\/1/)).toBeInTheDocument();
  });

  it('メンバー名がない場合はバッジを表示しない', () => {
    const allergy = createAllergy({ memberName: undefined });
    render(<AllergyList allergies={[allergy]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.queryByText('太郎')).not.toBeInTheDocument();
  });

  it('削除ボタンでonDeleteが呼ばれる', () => {
    const allergy = createAllergy();
    render(<AllergyList allergies={[allergy]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(mockOnDelete).toHaveBeenCalledWith('allergy-1');
  });

  it('編集ボタンで編集モードに切り替わる', () => {
    const allergy = createAllergy();
    render(<AllergyList allergies={[allergy]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    expect(screen.getByDisplayValue('ピーナッツ')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('編集キャンセルで元の表示に戻る', () => {
    const allergy = createAllergy();
    render(<AllergyList allergies={[allergy]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.click(screen.getByText('キャンセル'));
    expect(screen.getByText('ピーナッツ')).toBeInTheDocument();
    expect(screen.queryByText('保存')).not.toBeInTheDocument();
  });

  it('編集保存でonUpdateが呼ばれる', async () => {
    const allergy = createAllergy();
    render(<AllergyList allergies={[allergy]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.change(screen.getByDisplayValue('ピーナッツ'), { target: { value: '卵' } });
    fireEvent.click(screen.getByText('保存'));
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('allergy-1', expect.objectContaining({
        allergenName: '卵',
      }));
    });
  });

  it('複数のアレルギーを表示する', () => {
    const allergies = [
      createAllergy({ id: 'a1', allergenName: 'ピーナッツ' }),
      createAllergy({ id: 'a2', allergenName: '卵' }),
    ];
    render(<AllergyList allergies={allergies} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('ピーナッツ')).toBeInTheDocument();
    expect(screen.getByText('卵')).toBeInTheDocument();
  });
});
