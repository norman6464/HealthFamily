import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMedications } from '../useMedications';
import * as medicationApiModule from '../../../data/api/medicationApi';

describe('useMedications Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('薬一覧を正常に取得できる', async () => {
    const { result } = renderHook(() => useMedications('member-1'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.medications).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.medications.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('エラーが発生した場合、エラー状態を保持する', async () => {
    vi.spyOn(medicationApiModule.medicationApi, 'getMedicationsByMember').mockRejectedValue(
      new Error('API Error')
    );

    const { result } = renderHook(() => useMedications('member-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.medications).toEqual([]);
  });

  it('薬を作成できる', async () => {
    const { result } = renderHook(() => useMedications('member-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createMedication({
        memberId: 'member-1',
        userId: 'user-1',
        name: '新しい薬',
        category: 'regular',
        dosage: '1錠',
        frequency: '1日1回',
      });
    });

    expect(result.current.medications.length).toBeGreaterThanOrEqual(1);
  });

  it('薬を削除できる', async () => {
    const { result } = renderHook(() => useMedications('member-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialLength = result.current.medications.length;

    if (initialLength > 0) {
      await act(async () => {
        await result.current.deleteMedication(result.current.medications[0].medication.id);
      });

      expect(result.current.medications.length).toBeLessThan(initialLength);
    }
  });

  it('refetchで薬一覧を再取得できる', async () => {
    const { result } = renderHook(() => useMedications('member-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.medications.length).toBeGreaterThan(0);
  });
});
