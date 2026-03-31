import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMissedDoses, MissedDose } from '@/presentation/hooks/useMissedDoses';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockMissedDoses: MissedDose[] = [
  {
    date: '2026-03-28',
    scheduleId: 'sched-1',
    medicationName: 'クラリチン',
    memberName: 'ゆう',
    memberId: 'm1',
    scheduledTime: '11:00',
  },
  {
    date: '2026-03-27',
    scheduleId: 'sched-2',
    medicationName: 'ピモベハート',
    memberName: 'やじゅ',
    memberId: 'm2',
    scheduledTime: '08:00',
  },
];

describe('useMissedDoses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('飲み忘れデータを正常に取得する', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: mockMissedDoses }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useMissedDoses());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.missedDoses).toHaveLength(2);
    expect(result.current.missedDoses[0].medicationName).toBe('クラリチン');
    expect(result.current.error).toBeNull();
  });

  it('飲み忘れがない場合は空配列を返す', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useMissedDoses());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.missedDoses).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('API取得エラー時にerrorを設定する', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, error: 'エラー' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useMissedDoses());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });
});
