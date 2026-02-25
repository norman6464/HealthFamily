import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// console.errorを抑制（React Error Boundaryが出力するエラーログ）
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('ErrorBoundary', () => {
  it('子コンポーネントが正常な場合はそのまま表示する', () => {
    render(
      <ErrorBoundary>
        <div>正常コンテンツ</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('正常コンテンツ')).toBeInTheDocument();
  });

  it('子コンポーネントでエラーが発生した場合、フォールバックUIを表示する', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="テストエラー" />
      </ErrorBoundary>
    );

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText(/テストエラー/)).toBeInTheDocument();
  });

  it('「再読み込み」ボタンが表示される', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="テストエラー" />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: '再読み込み' })).toBeInTheDocument();
  });
});
