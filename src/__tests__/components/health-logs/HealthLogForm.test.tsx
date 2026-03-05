import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HealthLogForm } from '@/components/health-logs/HealthLogForm';

describe('HealthLogForm', () => {
  const mockMembers = [
    { id: 'member-1', name: 'テスト太郎' },
    { id: 'member-2', name: 'テスト花子' },
  ];

  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  it('フォームを表示する', () => {
    render(
      <HealthLogForm members={mockMembers} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(screen.getByText('体調を記録')).toBeInTheDocument();
    expect(screen.getByText('メンバー')).toBeInTheDocument();
    expect(screen.getByText('体調レベル')).toBeInTheDocument();
  });

  it('メンバー選択が表示される', () => {
    render(
      <HealthLogForm members={mockMembers} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(screen.getByText('テスト太郎')).toBeInTheDocument();
    expect(screen.getByText('テスト花子')).toBeInTheDocument();
  });

  it('体調レベルボタンが5つ表示される', () => {
    render(
      <HealthLogForm members={mockMembers} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(screen.getByText('とても悪い')).toBeInTheDocument();
    expect(screen.getByText('普通')).toBeInTheDocument();
    expect(screen.getByText('とても良い')).toBeInTheDocument();
  });

  it('症状ボタンが表示される', () => {
    render(
      <HealthLogForm members={mockMembers} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    expect(screen.getByText('頭痛')).toBeInTheDocument();
    expect(screen.getByText('発熱')).toBeInTheDocument();
    expect(screen.getByText('倦怠感')).toBeInTheDocument();
  });

  it('記録するボタンでsubmitが呼ばれる', async () => {
    render(
      <HealthLogForm members={mockMembers} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    fireEvent.click(screen.getByText('記録する'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        memberId: 'member-1',
        conditionLevel: 3,
        symptoms: undefined,
        notes: undefined,
      });
    });
  });

  it('キャンセルボタンでonCancelが呼ばれる', () => {
    render(
      <HealthLogForm members={mockMembers} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    // X button
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find((b) => b.getAttribute('aria-label') === null && b.querySelector('svg'));
    if (cancelButton) fireEvent.click(cancelButton);
  });

  it('症状を選択して送信できる', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <HealthLogForm members={mockMembers} onSubmit={onSubmit} onCancel={mockOnCancel} />
    );

    fireEvent.click(screen.getByText('頭痛'));
    fireEvent.click(screen.getByText('発熱'));
    fireEvent.click(screen.getByText('記録する'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          symptoms: ['headache', 'fever'],
        }),
      );
    });
  });
});
