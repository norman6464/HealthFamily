import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyStatePrompt } from '@/components/shared/EmptyStatePrompt';

describe('EmptyStatePrompt', () => {
  it('メッセージを表示する', () => {
    render(<EmptyStatePrompt message="データがありません" />);
    expect(screen.getByText('データがありません')).toBeInTheDocument();
  });

  it('アクションボタンを表示する', () => {
    const onAction = vi.fn();
    render(<EmptyStatePrompt message="薬がありません" actionLabel="薬を追加" onAction={onAction} />);
    const button = screen.getByText('薬を追加');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalled();
  });

  it('アクションが指定されない場合はボタンを表示しない', () => {
    render(<EmptyStatePrompt message="データがありません" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('アイコンが表示される', () => {
    const { container } = render(<EmptyStatePrompt message="テスト" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('サブメッセージを表示する', () => {
    render(<EmptyStatePrompt message="メインメッセージ" subMessage="詳細説明" />);
    expect(screen.getByText('詳細説明')).toBeInTheDocument();
  });
});
