import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const defaultProps = {
    title: '削除確認',
    message: 'この項目を削除しますか？',
    isOpen: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('開いている場合にタイトルとメッセージが表示される', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    expect(screen.getByText('削除確認')).toBeInTheDocument();
    expect(screen.getByText('この項目を削除しますか？')).toBeInTheDocument();
  });

  it('閉じている場合は何も表示しない', () => {
    const { container } = render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('確認ボタンをクリックするとonConfirmが呼ばれる', () => {
    const onConfirm = vi.fn();
    render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('確認'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('キャンセルボタンをクリックするとonCancelが呼ばれる', () => {
    const onCancel = vi.fn();
    render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('isDangerousの場合に確認ボタンが赤色スタイルになる', () => {
    render(<ConfirmationDialog {...defaultProps} isDangerous={true} />);
    const confirmBtn = screen.getByText('確認');
    expect(confirmBtn.className).toContain('bg-red');
  });
});
