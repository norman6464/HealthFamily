import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BodyMeasurementList } from '@/components/body-measurements/BodyMeasurementList';
import { BodyMeasurement } from '@/domain/entities/BodyMeasurement';

const createMeasurement = (overrides: Partial<BodyMeasurement> = {}): BodyMeasurement => ({
  id: 'bm-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  weight: 65.5,
  height: 170.0,
  recordedAt: new Date('2025-12-01'),
  notes: '朝食前に計測',
  createdAt: new Date(),
  ...overrides,
});

describe('BodyMeasurementList', () => {
  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('読み込み中を表示する', () => {
    render(<BodyMeasurementList measurements={[]} isLoading={true} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('空状態を表示する', () => {
    render(<BodyMeasurementList measurements={[]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('記録がありません')).toBeInTheDocument();
  });

  it('計測情報を表示する', () => {
    const measurement = createMeasurement();
    render(<BodyMeasurementList measurements={[measurement]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText(/65.5/)).toBeInTheDocument();
    expect(screen.getByText(/170/)).toBeInTheDocument();
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText('朝食前に計測')).toBeInTheDocument();
  });

  it('体重のみの場合も表示する', () => {
    const measurement = createMeasurement({ height: undefined });
    render(<BodyMeasurementList measurements={[measurement]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText(/65.5/)).toBeInTheDocument();
    expect(screen.queryByText(/身長/)).not.toBeInTheDocument();
  });

  it('身長のみの場合も表示する', () => {
    const measurement = createMeasurement({ weight: undefined });
    render(<BodyMeasurementList measurements={[measurement]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText(/170/)).toBeInTheDocument();
    expect(screen.queryByText(/体重/)).not.toBeInTheDocument();
  });

  it('削除ボタンでonDeleteが呼ばれる', () => {
    const measurement = createMeasurement();
    render(<BodyMeasurementList measurements={[measurement]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(mockOnDelete).toHaveBeenCalledWith('bm-1');
  });

  it('編集ボタンで編集モードに切り替わる', () => {
    const measurement = createMeasurement();
    render(<BodyMeasurementList measurements={[measurement]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    expect(screen.getByDisplayValue('65.5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('170')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
  });

  it('編集キャンセルで元の表示に戻る', () => {
    const measurement = createMeasurement();
    render(<BodyMeasurementList measurements={[measurement]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.click(screen.getByText('キャンセル'));
    expect(screen.getByText(/65.5/)).toBeInTheDocument();
    expect(screen.queryByText('保存')).not.toBeInTheDocument();
  });

  it('編集保存でonUpdateが呼ばれる', async () => {
    const measurement = createMeasurement();
    render(<BodyMeasurementList measurements={[measurement]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.change(screen.getByDisplayValue('65.5'), { target: { value: '70' } });
    fireEvent.click(screen.getByText('保存'));
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('bm-1', expect.objectContaining({
        weight: 70,
      }));
    });
  });

  it('複数の計測を表示する', () => {
    const measurements = [
      createMeasurement({ id: 'bm-1', weight: 65.5 }),
      createMeasurement({ id: 'bm-2', weight: 66.0 }),
    ];
    render(<BodyMeasurementList measurements={measurements} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText(/65.5/)).toBeInTheDocument();
    expect(screen.getByText(/66/)).toBeInTheDocument();
  });
});
