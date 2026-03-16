/**
 * 汎用データ取得フック
 * 共通のfetch/loading/errorパターンを抽出
 * cacheKeyを指定するとページ遷移時にキャッシュデータを即表示（stale-while-revalidate）
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseFetcherResult<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const dataCache = new Map<string, unknown>();

// テスト用: キャッシュをクリア
export const clearFetcherCache = (): void => {
  dataCache.clear();
};

export function useFetcher<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList,
  initialValue: T,
  cacheKey?: string,
): UseFetcherResult<T> {
  const cached = cacheKey ? (dataCache.get(cacheKey) as T | undefined) : undefined;
  const [data, setData] = useState<T>(cached ?? initialValue);
  const [isLoading, setIsLoading] = useState(cached === undefined);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      if (!dataCache.has(cacheKey ?? '')) {
        setIsLoading(true);
      }
      setError(null);
      const result = await asyncFn();
      if (mountedRef.current) {
        setData(result);
        if (cacheKey) {
          dataCache.set(cacheKey, result);
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
