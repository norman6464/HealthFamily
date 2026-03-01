import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HospitalList } from '@/components/hospitals/HospitalList';
import { Hospital } from '@/domain/entities/Hospital';

const createHospital = (overrides: Partial<Hospital> = {}): Hospital => ({
  id: 'hosp-1',
  userId: 'user-1',
  name: 'テスト病院',
  hospitalType: 'general',
  address: '東京都渋谷区1-1-1',
  phoneNumber: '03-1234-5678',
  notes: '駐車場あり',
  createdAt: new Date(),
  ...overrides,
});

describe('HospitalList', () => {
  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('読み込み中を表示する', () => {
    render(<HospitalList hospitals={[]} isLoading={true} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('空状態を表示する', () => {
    render(<HospitalList hospitals={[]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('病院が登録されていません')).toBeInTheDocument();
  });

  it('病院情報を表示する', () => {
    const hospital = createHospital();
    render(<HospitalList hospitals={[hospital]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('テスト病院')).toBeInTheDocument();
    expect(screen.getByText('東京都渋谷区1-1-1')).toBeInTheDocument();
    expect(screen.getByText('03-1234-5678')).toBeInTheDocument();
    expect(screen.getByText('駐車場あり')).toBeInTheDocument();
  });

  it('削除ボタンでonDeleteが呼ばれる', () => {
    const hospital = createHospital();
    render(<HospitalList hospitals={[hospital]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(mockOnDelete).toHaveBeenCalledWith('hosp-1');
  });

  it('編集ボタンで編集モードに切り替わる', () => {
    const hospital = createHospital();
    render(<HospitalList hospitals={[hospital]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    expect(screen.getByDisplayValue('テスト病院')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('編集キャンセルで元の表示に戻る', () => {
    const hospital = createHospital();
    render(<HospitalList hospitals={[hospital]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.click(screen.getByText('キャンセル'));
    expect(screen.getByText('テスト病院')).toBeInTheDocument();
    expect(screen.queryByText('保存')).not.toBeInTheDocument();
  });

  it('編集保存でonUpdateが呼ばれる', async () => {
    const hospital = createHospital();
    render(<HospitalList hospitals={[hospital]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.change(screen.getByDisplayValue('テスト病院'), { target: { value: '新しい病院名' } });
    fireEvent.click(screen.getByText('保存'));
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('hosp-1', expect.objectContaining({ name: '新しい病院名' }));
    });
  });
});
