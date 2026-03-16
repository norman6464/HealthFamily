import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUserProfile } from '@/presentation/hooks/useUserProfile';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockProfile = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'テストユーザー',
  createdAt: new Date(),
};

const mockUpdatedProfile = {
  ...mockProfile,
  name: '更新ユーザー',
};

const mockRepository = {
  getProfile: vi.fn().mockResolvedValue(mockProfile),
  updateProfile: vi.fn().mockResolvedValue(mockUpdatedProfile),
};

describe('useUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      userProfileRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('プロフィールを取得する', async () => {
    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.error).toBeNull();
  });

  it('updateProfileでプロフィールを更新しrefetchする', async () => {
    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let updated;
    await act(async () => {
      updated = await result.current.updateProfile({ name: '更新ユーザー' });
    });

    expect(updated).toEqual(mockUpdatedProfile);
    expect(mockRepository.updateProfile).toHaveBeenCalledWith({ name: '更新ユーザー' });
    expect(mockRepository.getProfile).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getProfile.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.profile).toBeNull();
  });
});
