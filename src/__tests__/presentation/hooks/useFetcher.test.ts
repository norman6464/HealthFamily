import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFetcher } from '@/presentation/hooks/useFetcher';

describe('useFetcher', () => {
  it('初期状態でisLoadingがtrueでdataがinitialValueである', () => {
    const asyncFn = vi.fn().mockResolvedValue(['item1']);
    const { result } = renderHook(() => useFetcher(asyncFn, [], []));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('データ取得成功時にdataを更新しisLoadingをfalseにする', async () => {
    const mockData = ['item1', 'item2'];
    const asyncFn = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useFetcher(asyncFn, [], []));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('データ取得失敗時にerrorを設定する', async () => {
    const asyncFn = vi.fn().mockRejectedValue(new Error('取得エラー'));
    const { result } = renderHook(() => useFetcher(asyncFn, [], []));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得エラー'));
    expect(result.current.data).toEqual([]);
  });

  it('refetchでデータを再取得する', async () => {
    const asyncFn = vi.fn()
      .mockResolvedValueOnce(['first'])
      .mockResolvedValueOnce(['second']);
    const { result } = renderHook(() => useFetcher(asyncFn, [], []));

    await waitFor(() => {
      expect(result.current.data).toEqual(['first']);
    });

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.data).toEqual(['second']);
    });
    expect(asyncFn).toHaveBeenCalledTimes(2);
  });

  it('Error以外の例外をErrorオブジェクトに変換する', async () => {
    const asyncFn = vi.fn().mockRejectedValue('文字列エラー');
    const { result } = renderHook(() => useFetcher(asyncFn, [], null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Unknown error');
  });
});
