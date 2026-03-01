import { describe, it, expect, vi } from 'vitest';
import { GetUserProfile, UpdateUserProfile } from '@/domain/usecases/ManageUserProfile';
import { UserProfileRepository, UserProfile } from '@/domain/repositories/UserProfileRepository';

const mockProfile: UserProfile = {
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'テストユーザー',
  characterType: 'dog',
  characterName: null,
};

const createMockRepository = (): UserProfileRepository => ({
  getProfile: vi.fn().mockResolvedValue(mockProfile),
  updateProfile: vi.fn().mockResolvedValue({ ...mockProfile, displayName: '更新名' }),
});

describe('GetUserProfile', () => {
  it('プロフィールを取得する', async () => {
    const repo = createMockRepository();
    const useCase = new GetUserProfile(repo);
    const result = await useCase.execute();

    expect(result).toBe(mockProfile);
    expect(repo.getProfile).toHaveBeenCalled();
  });
});

describe('UpdateUserProfile', () => {
  it('表示名を更新する', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateUserProfile(repo);
    const result = await useCase.execute({ displayName: '更新名' });

    expect(result.displayName).toBe('更新名');
    expect(repo.updateProfile).toHaveBeenCalledWith({ displayName: '更新名' });
  });

  it('空の表示名の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateUserProfile(repo);

    await expect(
      useCase.execute({ displayName: '' })
    ).rejects.toThrow('表示名は空にできません');
  });

  it('空白のみの表示名の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateUserProfile(repo);

    await expect(
      useCase.execute({ displayName: '   ' })
    ).rejects.toThrow('表示名は空にできません');
  });
});
