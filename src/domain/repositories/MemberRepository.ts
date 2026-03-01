/**
 * メンバーリポジトリインターフェース
 * 依存関係逆転の原則（DIP）に従い、Domain層がData層に依存しない
 */

import { Member } from '../entities/Member';
import { MemberSummary } from '../entities/MemberSummary';

export interface CreateMemberInput {
  userId: string;
  memberType: 'human' | 'pet';
  name: string;
  petType?: 'dog' | 'cat' | 'rabbit' | 'bird' | 'other';
  birthDate?: Date;
  notes?: string;
}

export interface UpdateMemberInput {
  name?: string;
  petType?: 'dog' | 'cat' | 'rabbit' | 'bird' | 'other';
  birthDate?: Date;
  notes?: string;
}

export interface MemberRepository {
  getMembers(userId: string): Promise<Member[]>;
  getMemberById(memberId: string): Promise<Member | null>;
  createMember(input: CreateMemberInput): Promise<Member>;
  updateMember(memberId: string, input: UpdateMemberInput): Promise<Member>;
  deleteMember(memberId: string): Promise<void>;
  getMemberSummaries(): Promise<MemberSummary[]>;
}
