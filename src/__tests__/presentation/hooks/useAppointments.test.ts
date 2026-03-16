import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAppointments } from '@/presentation/hooks/useAppointments';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockAppointment = {
  id: 'apt-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  hospitalId: 'hosp-1',
  hospitalName: 'テスト病院',
  appointmentDate: new Date('2026-01-15'),
  notes: '',
  createdAt: new Date(),
};

const mockRepository = {
  getAppointments: vi.fn().mockResolvedValue([mockAppointment]),
  getAppointmentById: vi.fn(),
  createAppointment: vi.fn().mockResolvedValue(mockAppointment),
  updateAppointment: vi.fn().mockResolvedValue(mockAppointment),
  deleteAppointment: vi.fn().mockResolvedValue(undefined),
};

describe('useAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      appointmentRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('通院予定一覧を取得する', async () => {
    const { result } = renderHook(() => useAppointments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('createAppointmentで予約を作成しrefetchする', async () => {
    const { result } = renderHook(() => useAppointments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createAppointment({
        memberId: 'member-1',
        hospitalId: 'hosp-1',
        appointmentDate: '2026-02-01',
      });
    });

    expect(mockRepository.createAppointment).toHaveBeenCalled();
    expect(mockRepository.getAppointments).toHaveBeenCalledTimes(2);
  });

  it('deleteAppointmentで予約を削除しrefetchする', async () => {
    const { result } = renderHook(() => useAppointments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteAppointment('apt-1');
    });

    expect(mockRepository.deleteAppointment).toHaveBeenCalledWith('apt-1');
    expect(mockRepository.getAppointments).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getAppointments.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useAppointments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.appointments).toEqual([]);
  });
});
