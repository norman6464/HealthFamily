import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMedicationRecordActions } from '@/presentation/hooks/useMedicationRecordActions';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';

const mockRepository = {
  getRecords: vi.fn(),
  createRecord: vi.fn().mockResolvedValue(undefined),
  deleteRecord: vi.fn(),
  getAdherenceStats: vi.fn(),
  getHistory: vi.fn(),
  getAdherenceTrends: vi.fn(),
};

describe('useMedicationRecordActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDIContainer({
      medicationRecordRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('初期状態でisLoadingがfalseでerrorがnullである', () => {
    const { result } = renderHook(() => useMedicationRecordActions());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('markAsTakenで服薬記録を作成する', async () => {
    const { result } = renderHook(() => useMedicationRecordActions());

    await act(async () => {
      await result.current.markAsTaken('member-1', 'med-1', 'メモ');
    });

    expect(mockRepository.createRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: 'member-1',
        medicationId: 'med-1',
        notes: 'メモ',
      })
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('markAsTakenAtで指定時刻の服薬記録を作成する', async () => {
    const { result } = renderHook(() => useMedicationRecordActions());

    await act(async () => {
      await result.current.markAsTakenAt('member-1', 'med-1', '2025-12-01T08:00:00');
    });

    expect(mockRepository.createRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: 'member-1',
        medicationId: 'med-1',
        takenAt: '2025-12-01T08:00:00',
      })
    );
  });

  it('エラー時にerrorを設定しthrowする', async () => {
    mockRepository.createRecord.mockRejectedValueOnce(new Error('記録失敗'));
    const { result } = renderHook(() => useMedicationRecordActions());

    await act(async () => {
      try {
        await result.current.markAsTaken('member-1', 'med-1');
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.isLoading).toBe(false);
  });
});
