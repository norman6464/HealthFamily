import { Member } from '../../domain/entities/Member';
import { CreateMemberInput, UpdateMemberInput } from '../../domain/repositories/MemberRepository';
import { apiClient } from './apiClient';
import { BackendMember } from './types';
import { toMember } from './mappers';

export const memberApi = {
  async getMembers(_userId: string): Promise<Member[]> {
    const data = await apiClient.get<BackendMember[]>('/members');
    return data.map(toMember);
  },

  async getMemberById(memberId: string): Promise<Member | null> {
    try {
      const data = await apiClient.get<BackendMember>(`/members/${memberId}`);
      return toMember(data);
    } catch {
      return null;
    }
  },

  async createMember(input: CreateMemberInput): Promise<Member> {
    const data = await apiClient.post<BackendMember>('/members', {
      name: input.name,
      memberType: input.memberType,
      petType: input.petType,
      birthDate: input.birthDate?.toISOString(),
      notes: input.notes,
    });
    return toMember(data);
  },

  async updateMember(memberId: string, input: UpdateMemberInput): Promise<Member> {
    const data = await apiClient.put<BackendMember>(`/members/${memberId}`, {
      name: input.name,
      petType: input.petType,
      birthDate: input.birthDate?.toISOString(),
      notes: input.notes,
    });
    return toMember(data);
  },

  async deleteMember(memberId: string): Promise<void> {
    await apiClient.del(`/members/${memberId}`);
  },
};
