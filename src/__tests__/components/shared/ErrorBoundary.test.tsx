import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('テストエラー');
  return <div>正常コンテンツ</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('エラーがない場合は子コンポーネントを表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('正常コンテンツ')).toBeInTheDocument();
  });

  it('エラー発生時にエラーメッセージを表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('テストエラー')).toBeInTheDocument();
  });

  it('エラー発生時に再読み込みボタンを表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('再読み込み')).toBeInTheDocument();
  });

  it('再読み込みボタンをクリックするとwindow.location.reloadが呼ばれる', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByText('再読み込み'));
    expect(reloadMock).toHaveBeenCalled();
  });

  it('エラー発生時にconsole.errorが呼ばれる', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(consoleSpy).toHaveBeenCalled();
  });
});
