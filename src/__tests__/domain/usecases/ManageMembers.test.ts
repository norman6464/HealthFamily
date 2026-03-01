import { describe, it, expect, vi } from 'vitest';
import { GetMembers, CreateMember, UpdateMember, DeleteMember } from '@/domain/usecases/ManageMembers';
import { MemberRepository } from '@/domain/repositories/MemberRepository';
import { Member } from '@/domain/entities/Member';

const mockMember: Member = {
  id: 'mem-1',
  userId: 'user-1',
  memberType: 'human',
  name: 'テスト太郎',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createMockRepository = (): MemberRepository => ({
  getMembers: vi.fn().mockResolvedValue([mockMember]),
  getMemberById: vi.fn().mockResolvedValue(mockMember),
  createMember: vi.fn().mockResolvedValue(mockMember),
  updateMember: vi.fn().mockResolvedValue({ ...mockMember, name: '更新太郎' }),
  deleteMember: vi.fn().mockResolvedValue(undefined),
});

describe('GetMembers', () => {
  it('メンバー一覧を取得する', async () => {
    const repo = createMockRepository();
    const useCase = new GetMembers(repo);
    const result = await useCase.execute('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('テスト太郎');
    expect(repo.getMembers).toHaveBeenCalledWith('user-1');
  });

  it('空の配列を返す場合もエラーにならない', async () => {
    const repo = createMockRepository();
    (repo.getMembers as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const useCase = new GetMembers(repo);
    const result = await useCase.execute('user-1');

    expect(result).toHaveLength(0);
  });

  it('リポジトリがエラーを投げた場合そのまま伝搬する', async () => {
    const repo = createMockRepository();
    (repo.getMembers as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB接続エラー'));
    const useCase = new GetMembers(repo);

    await expect(useCase.execute('user-1')).rejects.toThrow('DB接続エラー');
  });
});

describe('CreateMember', () => {
  it('有効な入力でメンバーを作成する', async () => {
    const repo = createMockRepository();
    const useCase = new CreateMember(repo);
    const result = await useCase.execute({
      userId: 'user-1',
      memberType: 'human',
      name: 'テスト太郎',
    });

    expect(result.name).toBe('テスト太郎');
    expect(repo.createMember).toHaveBeenCalled();
  });

  it('空の名前の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateMember(repo);

    await expect(
      useCase.execute({ userId: 'user-1', memberType: 'human', name: '' })
    ).rejects.toThrow('メンバー名は必須です');
  });

  it('空白のみの名前の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateMember(repo);

    await expect(
      useCase.execute({ userId: 'user-1', memberType: 'human', name: '   ' })
    ).rejects.toThrow('メンバー名は必須です');
  });

  it('リポジトリがエラーを投げた場合そのまま伝搬する', async () => {
    const repo = createMockRepository();
    (repo.createMember as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('作成失敗'));
    const useCase = new CreateMember(repo);

    await expect(
      useCase.execute({ userId: 'user-1', memberType: 'human', name: 'テスト' })
    ).rejects.toThrow('作成失敗');
  });
});

describe('UpdateMember', () => {
  it('存在するメンバーを更新する', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateMember(repo);
    const result = await useCase.execute('mem-1', { name: '更新太郎' });

    expect(result.name).toBe('更新太郎');
    expect(repo.getMemberById).toHaveBeenCalledWith('mem-1');
    expect(repo.updateMember).toHaveBeenCalledWith('mem-1', { name: '更新太郎' });
  });

  it('存在しないメンバーの更新でエラーを投げる', async () => {
    const repo = createMockRepository();
    (repo.getMemberById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const useCase = new UpdateMember(repo);

    await expect(
      useCase.execute('nonexistent', { name: '更新' })
    ).rejects.toThrow('メンバーが見つかりません');
  });
});

describe('DeleteMember', () => {
  it('存在するメンバーを削除する', async () => {
    const repo = createMockRepository();
    const useCase = new DeleteMember(repo);
    await useCase.execute('mem-1');

    expect(repo.getMemberById).toHaveBeenCalledWith('mem-1');
    expect(repo.deleteMember).toHaveBeenCalledWith('mem-1');
  });

  it('存在しないメンバーの削除でエラーを投げる', async () => {
    const repo = createMockRepository();
    (repo.getMemberById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const useCase = new DeleteMember(repo);

    await expect(
      useCase.execute('nonexistent')
    ).rejects.toThrow('メンバーが見つかりません');
  });
});
