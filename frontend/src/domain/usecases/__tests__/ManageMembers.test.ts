import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetMembers, CreateMember, UpdateMember, DeleteMember } from '../ManageMembers';
import { MemberRepository } from '../../repositories/MemberRepository';
import { Member } from '../../entities/Member';

const mockMembers: Member[] = [
  {
    id: 'member-1',
    userId: 'user-1',
    memberType: 'human',
    name: 'パパ',
    birthDate: new Date('1985-06-15'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'member-2',
    userId: 'user-1',
    memberType: 'pet',
    name: 'ポチ',
    petType: 'dog',
    birthDate: new Date('2020-03-10'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

describe('GetMembers', () => {
  let mockRepository: MemberRepository;

  beforeEach(() => {
    mockRepository = {
      getMembers: vi.fn().mockResolvedValue(mockMembers),
      getMemberById: vi.fn(),
      createMember: vi.fn(),
      updateMember: vi.fn(),
      deleteMember: vi.fn(),
    };
  });

  it('ユーザーのメンバー一覧を取得できる', async () => {
    const useCase = new GetMembers(mockRepository);
    const result = await useCase.execute('user-1');

    expect(mockRepository.getMembers).toHaveBeenCalledWith('user-1');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('パパ');
    expect(result[1].name).toBe('ポチ');
  });

  it('メンバーがいない場合、空配列を返す', async () => {
    mockRepository.getMembers = vi.fn().mockResolvedValue([]);
    const useCase = new GetMembers(mockRepository);
    const result = await useCase.execute('user-1');

    expect(result).toHaveLength(0);
  });
});

describe('CreateMember', () => {
  let mockRepository: MemberRepository;

  beforeEach(() => {
    mockRepository = {
      getMembers: vi.fn(),
      getMemberById: vi.fn(),
      createMember: vi.fn().mockResolvedValue({
        id: 'member-3',
        userId: 'user-1',
        memberType: 'human',
        name: 'ママ',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      updateMember: vi.fn(),
      deleteMember: vi.fn(),
    };
  });

  it('新しいメンバーを作成できる', async () => {
    const useCase = new CreateMember(mockRepository);
    const result = await useCase.execute({
      userId: 'user-1',
      memberType: 'human',
      name: 'ママ',
    });

    expect(mockRepository.createMember).toHaveBeenCalledWith({
      userId: 'user-1',
      memberType: 'human',
      name: 'ママ',
    });
    expect(result.name).toBe('ママ');
    expect(result.id).toBe('member-3');
  });

  it('名前が空の場合、エラーをスローする', async () => {
    const useCase = new CreateMember(mockRepository);

    await expect(
      useCase.execute({
        userId: 'user-1',
        memberType: 'human',
        name: '',
      })
    ).rejects.toThrow('メンバー名は必須です');
  });

  it('名前が空白のみの場合、エラーをスローする', async () => {
    const useCase = new CreateMember(mockRepository);

    await expect(
      useCase.execute({
        userId: 'user-1',
        memberType: 'human',
        name: '   ',
      })
    ).rejects.toThrow('メンバー名は必須です');
  });
});

describe('UpdateMember', () => {
  let mockRepository: MemberRepository;

  beforeEach(() => {
    mockRepository = {
      getMembers: vi.fn(),
      getMemberById: vi.fn().mockResolvedValue(mockMembers[0]),
      createMember: vi.fn(),
      updateMember: vi.fn().mockResolvedValue({
        ...mockMembers[0],
        name: '父',
        updatedAt: new Date(),
      }),
      deleteMember: vi.fn(),
    };
  });

  it('メンバー情報を更新できる', async () => {
    const useCase = new UpdateMember(mockRepository);
    const result = await useCase.execute('member-1', { name: '父' });

    expect(mockRepository.updateMember).toHaveBeenCalledWith('member-1', { name: '父' });
    expect(result.name).toBe('父');
  });

  it('存在しないメンバーを更新しようとするとエラーをスローする', async () => {
    mockRepository.getMemberById = vi.fn().mockResolvedValue(null);
    const useCase = new UpdateMember(mockRepository);

    await expect(
      useCase.execute('non-existent', { name: '新名前' })
    ).rejects.toThrow('メンバーが見つかりません');
  });
});

describe('DeleteMember', () => {
  let mockRepository: MemberRepository;

  beforeEach(() => {
    mockRepository = {
      getMembers: vi.fn(),
      getMemberById: vi.fn().mockResolvedValue(mockMembers[0]),
      createMember: vi.fn(),
      updateMember: vi.fn(),
      deleteMember: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('メンバーを削除できる', async () => {
    const useCase = new DeleteMember(mockRepository);
    await useCase.execute('member-1');

    expect(mockRepository.deleteMember).toHaveBeenCalledWith('member-1');
  });

  it('存在しないメンバーを削除しようとするとエラーをスローする', async () => {
    mockRepository.getMemberById = vi.fn().mockResolvedValue(null);
    const useCase = new DeleteMember(mockRepository);

    await expect(useCase.execute('non-existent')).rejects.toThrow('メンバーが見つかりません');
  });
});
