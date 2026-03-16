import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BodyMeasurementForm } from '@/components/body-measurements/BodyMeasurementForm';
import { Member } from '@/domain/entities/Member';

const createMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'member-1',
  userId: 'user-1',
  name: '太郎',
  species: 'dog',
  breed: null,
  birthDate: null,
  iconType: 'dog',
  createdAt: new Date(),
  ...overrides,
});

describe('BodyMeasurementForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const members = [createMember(), createMember({ id: 'member-2', name: '花子' })];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('全フォーム要素を表示する', () => {
    render(<BodyMeasurementForm members={members} onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText('メンバー')).toBeInTheDocument();
    expect(screen.getByLabelText('体重 (kg)')).toBeInTheDocument();
    expect(screen.getByLabelText('身長 (cm)')).toBeInTheDocument();
    expect(screen.getByLabelText('記録日')).toBeInTheDocument();
    expect(screen.getByLabelText(/メモ/)).toBeInTheDocument();
    expect(screen.getByText('記録する')).toBeInTheDocument();
  });

  it('メンバーが1人のみの場合は自動選択される', () => {
    render(<BodyMeasurementForm members={[createMember()]} onSubmit={mockOnSubmit} />);
    const select = screen.getByLabelText('メンバー') as HTMLSelectElement;
    expect(select.value).toBe('member-1');
  });

  it('体重も身長も未入力の場合は送信しない', () => {
    render(<BodyMeasurementForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.click(screen.getByText('記録する'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('体重のみで送信できる', () => {
    render(<BodyMeasurementForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('体重 (kg)'), { target: { value: '65.5' } });
    fireEvent.click(screen.getByText('記録する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      memberId: 'member-1',
      weight: 65.5,
    }));
  });

  it('身長のみで送信できる', () => {
    render(<BodyMeasurementForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('身長 (cm)'), { target: { value: '170' } });
    fireEvent.click(screen.getByText('記録する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      memberId: 'member-1',
      height: 170,
    }));
  });

  it('キャンセルボタンでonCancelが呼ばれる', () => {
    render(<BodyMeasurementForm members={members} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('onCancelが未指定の場合はキャンセルボタンを表示しない', () => {
    render(<BodyMeasurementForm members={members} onSubmit={mockOnSubmit} />);
    expect(screen.queryByText('キャンセル')).not.toBeInTheDocument();
  });

  it('initialDataがある場合は更新ボタンを表示する', () => {
    render(
      <BodyMeasurementForm
        members={members}
        onSubmit={mockOnSubmit}
        initialData={{
          memberId: 'member-1',
          weight: 70,
          height: 175,
          recordedAt: '2025-12-01',
        }}
      />
    );
    expect(screen.getByText('更新する')).toBeInTheDocument();
    expect(screen.getByDisplayValue('70')).toBeInTheDocument();
    expect(screen.getByDisplayValue('175')).toBeInTheDocument();
  });

  it('送信後にフォームがリセットされる（新規登録時）', () => {
    render(<BodyMeasurementForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('体重 (kg)'), { target: { value: '65' } });
    fireEvent.click(screen.getByText('記録する'));
    expect((screen.getByLabelText('体重 (kg)') as HTMLInputElement).value).toBe('');
  });
});
