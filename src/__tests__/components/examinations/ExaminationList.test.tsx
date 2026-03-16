import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExaminationList } from '@/components/examinations/ExaminationList';
import { Examination } from '@/domain/entities/Examination';

const createExamination = (overrides: Partial<Examination> = {}): Examination => ({
  id: 'exam-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  examinationType: '血液検査',
  examinedAt: new Date('2025-11-15'),
  nextScheduledDate: new Date('2026-05-15'),
  notes: '空腹時に検査',
  createdAt: new Date(),
  ...overrides,
});

describe('ExaminationList', () => {
  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('読み込み中を表示する', () => {
    render(<ExaminationList examinations={[]} isLoading={true} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('空状態を表示する', () => {
    render(<ExaminationList examinations={[]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('検査記録がありません')).toBeInTheDocument();
  });

  it('検査情報を表示する', () => {
    const exam = createExamination();
    render(<ExaminationList examinations={[exam]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('血液検査')).toBeInTheDocument();
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText('空腹時に検査')).toBeInTheDocument();
  });

  it('検査日を表示する', () => {
    const exam = createExamination();
    render(<ExaminationList examinations={[exam]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText(/2025年11月15日/)).toBeInTheDocument();
  });

  it('次回予定日を表示する', () => {
    const exam = createExamination();
    render(<ExaminationList examinations={[exam]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText(/2026年5月15日/)).toBeInTheDocument();
  });

  it('次回予定日が過ぎている場合に期限切れを表示する', () => {
    const exam = createExamination({
      nextScheduledDate: new Date('2020-01-01'),
    });
    render(<ExaminationList examinations={[exam]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('(期限切れ)')).toBeInTheDocument();
  });

  it('削除ボタンでonDeleteが呼ばれる', () => {
    const exam = createExamination();
    render(<ExaminationList examinations={[exam]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(mockOnDelete).toHaveBeenCalledWith('exam-1');
  });

  it('編集ボタンで編集モードに切り替わる', () => {
    const exam = createExamination();
    render(<ExaminationList examinations={[exam]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    expect(screen.getByDisplayValue('血液検査')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('編集キャンセルで元の表示に戻る', () => {
    const exam = createExamination();
    render(<ExaminationList examinations={[exam]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.click(screen.getByText('キャンセル'));
    expect(screen.getByText('血液検査')).toBeInTheDocument();
    expect(screen.queryByText('保存')).not.toBeInTheDocument();
  });

  it('編集保存でonUpdateが呼ばれる', async () => {
    const exam = createExamination();
    render(<ExaminationList examinations={[exam]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.change(screen.getByDisplayValue('血液検査'), { target: { value: 'CT検査' } });
    fireEvent.click(screen.getByText('保存'));
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('exam-1', expect.objectContaining({
        examinationType: 'CT検査',
      }));
    });
  });

  it('複数の検査を表示する', () => {
    const exams = [
      createExamination({ id: 'e1', examinationType: '血液検査' }),
      createExamination({ id: 'e2', examinationType: 'CT検査' }),
    ];
    render(<ExaminationList examinations={exams} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('血液検査')).toBeInTheDocument();
    expect(screen.getByText('CT検査')).toBeInTheDocument();
  });
});
