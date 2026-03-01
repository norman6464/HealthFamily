/**
 * メンバー管理ユースケース
 * メンバーのCRUD操作のビジネスロジックを集約
 */

import { Member } from '../entities/Member';
import { MemberSummary } from '../entities/MemberSummary';
import {
  MemberRepository,
  CreateMemberInput,
  UpdateMemberInput,
} from '../repositories/MemberRepository';

/**
 * メンバー一覧取得ユースケース
 */
export class GetMembers {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(userId: string): Promise<Member[]> {
    return this.memberRepository.getMembers(userId);
  }
}

/**
 * メンバー作成ユースケース
 */
export class CreateMember {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(input: CreateMemberInput): Promise<Member> {
    if (!input.name.trim()) {
      throw new Error('メンバー名は必須です');
    }

    return this.memberRepository.createMember(input);
  }
}

/**
 * メンバー更新ユースケース
 */
export class UpdateMember {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(memberId: string, input: UpdateMemberInput): Promise<Member> {
    const existing = await this.memberRepository.getMemberById(memberId);
    if (!existing) {
      throw new Error('メンバーが見つかりません');
    }

    return this.memberRepository.updateMember(memberId, input);
  }
}

/**
 * メンバー削除ユースケース
 */
export class DeleteMember {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(memberId: string): Promise<void> {
    const existing = await this.memberRepository.getMemberById(memberId);
    if (!existing) {
      throw new Error('メンバーが見つかりません');
    }

    return this.memberRepository.deleteMember(memberId);
  }
}

export class GetMemberSummaries {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(): Promise<MemberSummary[]> {
    return this.memberRepository.getMemberSummaries();
  }
}
