import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEmergencyContacts } from '@/presentation/hooks/useEmergencyContacts';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockContact = {
  id: 'ec-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  contactName: '田中花子',
  phoneNumber: '090-1234-5678',
  relationship: '母',
  notes: '',
  createdAt: new Date(),
};

const mockRepository = {
  getAll: vi.fn().mockResolvedValue([mockContact]),
  getById: vi.fn(),
  create: vi.fn().mockResolvedValue(mockContact),
  update: vi.fn().mockResolvedValue(mockContact),
  delete: vi.fn().mockResolvedValue(undefined),
};

describe('useEmergencyContacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      emergencyContactRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('緊急連絡先一覧を取得する', async () => {
    const { result } = renderHook(() => useEmergencyContacts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contacts).toEqual([mockContact]);
    expect(result.current.error).toBeNull();
  });

  it('createContactで連絡先を登録しrefetchする', async () => {
    const { result } = renderHook(() => useEmergencyContacts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createContact({
        memberId: 'member-1',
        contactName: '佐藤一郎',
        phoneNumber: '080-9876-5432',
      });
    });

    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('deleteContactで連絡先を削除しrefetchする', async () => {
    const { result } = renderHook(() => useEmergencyContacts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteContact('ec-1');
    });

    expect(mockRepository.delete).toHaveBeenCalledWith('ec-1');
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getAll.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useEmergencyContacts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.contacts).toEqual([]);
  });
});
