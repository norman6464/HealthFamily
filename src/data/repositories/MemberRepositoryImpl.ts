/**
 * メンバーリポジトリの実装
 * Domain層のインターフェースを実装
 */

import {
  MemberRepository,
  CreateMemberInput,
  UpdateMemberInput,
} from '../../domain/repositories/MemberRepository';
import { Member } from '../../domain/entities/Member';
import { memberApi } from '../api/memberApi';

export class MemberRepositoryImpl implements MemberRepository {
  async getMembers(userId: string): Promise<Member[]> {
    return memberApi.getMembers(userId);
  }

  async getMemberById(memberId: string): Promise<Member | null> {
    return memberApi.getMemberById(memberId);
  }

  async createMember(input: CreateMemberInput): Promise<Member> {
    return memberApi.createMember(input);
  }

  async updateMember(memberId: string, input: UpdateMemberInput): Promise<Member> {
    return memberApi.updateMember(memberId, input);
  }

  async deleteMember(memberId: string): Promise<void> {
    return memberApi.deleteMember(memberId);
  }
}
