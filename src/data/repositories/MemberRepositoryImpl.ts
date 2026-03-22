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
import { MemberSummary } from '../../domain/entities/MemberSummary';
import { MemberProfile } from '../../domain/entities/MemberProfile';
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

  async getMemberSummaries(): Promise<MemberSummary[]> {
    return memberApi.getMemberSummaries();
  }

  async getMemberProfile(_memberId: string): Promise<MemberProfile | null> {
    // フロントエンドからは使用しない（サーバーサイド専用）
    return null;
  }
}
