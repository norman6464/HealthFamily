/**
 * メンバーAPI クライアント
 * 実際のAPIエンドポイントとの通信を担当（現在はモック）
 */

import { Member } from '../../domain/entities/Member';
import { CreateMemberInput, UpdateMemberInput } from '../../domain/repositories/MemberRepository';

// モックデータ
let mockMembers: Member[] = [
  {
    id: 'member-1',
    userId: 'user-1',
    memberType: 'human',
    name: 'パパ',
    birthDate: new Date('1985-06-15'),
    notes: '高血圧',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'member-2',
    userId: 'user-1',
    memberType: 'human',
    name: 'ママ',
    birthDate: new Date('1988-03-20'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'member-3',
    userId: 'user-1',
    memberType: 'pet',
    name: 'ポチ',
    petType: 'dog',
    birthDate: new Date('2020-03-10'),
    notes: 'フィラリア注意',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const memberApi = {
  async getMembers(userId: string): Promise<Member[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockMembers.filter((m) => m.userId === userId);
  },

  async getMemberById(memberId: string): Promise<Member | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockMembers.find((m) => m.id === memberId) || null;
  },

  async createMember(input: CreateMemberInput): Promise<Member> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newMember: Member = {
      id: `member-${Date.now()}`,
      userId: input.userId,
      memberType: input.memberType,
      name: input.name,
      petType: input.petType,
      birthDate: input.birthDate,
      notes: input.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockMembers = [...mockMembers, newMember];
    return newMember;
  },

  async updateMember(memberId: string, input: UpdateMemberInput): Promise<Member> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockMembers.findIndex((m) => m.id === memberId);
    if (index === -1) throw new Error('メンバーが見つかりません');

    const updated: Member = {
      ...mockMembers[index],
      ...input,
      updatedAt: new Date(),
    };
    mockMembers = mockMembers.map((m) => (m.id === memberId ? updated : m));
    return updated;
  },

  async deleteMember(memberId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    mockMembers = mockMembers.filter((m) => m.id !== memberId);
  },
};
