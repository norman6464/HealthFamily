import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VaccinationList } from '@/components/vaccinations/VaccinationList';
import { Vaccination } from '@/domain/entities/Vaccination';

const createVaccination = (overrides: Partial<Vaccination> = {}): Vaccination => ({
  id: 'vacc-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  vaccineName: 'インフルエンザ',
  vaccinatedAt: new Date('2025-10-01'),
  nextScheduledDate: new Date('2026-10-01'),
  notes: '左腕に接種',
  createdAt: new Date(),
  ...overrides,
});

describe('VaccinationList', () => {
  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('読み込み中を表示する', () => {
    render(<VaccinationList vaccinations={[]} isLoading={true} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('空状態を表示する', () => {
    render(<VaccinationList vaccinations={[]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('ワクチン記録がありません')).toBeInTheDocument();
  });

  it('ワクチン情報を表示する', () => {
    const vaccination = createVaccination();
    render(<VaccinationList vaccinations={[vaccination]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('インフルエンザ')).toBeInTheDocument();
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText('左腕に接種')).toBeInTheDocument();
  });

  it('接種日を表示する', () => {
    const vaccination = createVaccination();
    render(<VaccinationList vaccinations={[vaccination]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText(/2025年10月1日/)).toBeInTheDocument();
  });

  it('次回予定日を表示する', () => {
    const vaccination = createVaccination();
    render(<VaccinationList vaccinations={[vaccination]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText(/2026年10月1日/)).toBeInTheDocument();
  });

  it('次回予定日が過ぎている場合に期限切れを表示する', () => {
    const vaccination = createVaccination({
      nextScheduledDate: new Date('2020-01-01'),
    });
    render(<VaccinationList vaccinations={[vaccination]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('(期限切れ)')).toBeInTheDocument();
  });

  it('メンバー名がない場合はバッジを表示しない', () => {
    const vaccination = createVaccination({ memberName: undefined });
    render(<VaccinationList vaccinations={[vaccination]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.queryByText('太郎')).not.toBeInTheDocument();
  });

  it('削除ボタンでonDeleteが呼ばれる', () => {
    const vaccination = createVaccination();
    render(<VaccinationList vaccinations={[vaccination]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(mockOnDelete).toHaveBeenCalledWith('vacc-1');
  });

  it('編集ボタンで編集モードに切り替わる', () => {
    const vaccination = createVaccination();
    render(<VaccinationList vaccinations={[vaccination]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    expect(screen.getByDisplayValue('インフルエンザ')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('編集キャンセルで元の表示に戻る', () => {
    const vaccination = createVaccination();
    render(<VaccinationList vaccinations={[vaccination]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.click(screen.getByText('キャンセル'));
    expect(screen.getByText('インフルエンザ')).toBeInTheDocument();
    expect(screen.queryByText('保存')).not.toBeInTheDocument();
  });

  it('編集保存でonUpdateが呼ばれる', async () => {
    const vaccination = createVaccination();
    render(<VaccinationList vaccinations={[vaccination]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.change(screen.getByDisplayValue('インフルエンザ'), { target: { value: 'コロナワクチン' } });
    fireEvent.click(screen.getByText('保存'));
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('vacc-1', expect.objectContaining({
        vaccineName: 'コロナワクチン',
      }));
    });
  });

  it('複数のワクチンを表示する', () => {
    const vaccinations = [
      createVaccination({ id: 'v1', vaccineName: 'インフルエンザ' }),
      createVaccination({ id: 'v2', vaccineName: 'コロナワクチン' }),
    ];
    render(<VaccinationList vaccinations={vaccinations} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('インフルエンザ')).toBeInTheDocument();
    expect(screen.getByText('コロナワクチン')).toBeInTheDocument();
  });
});
