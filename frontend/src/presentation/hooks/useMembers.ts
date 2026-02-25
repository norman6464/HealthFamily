/**
 * メンバー管理カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useState, useEffect, useCallback } from 'react';
import { Member } from '../../domain/entities/Member';
import { GetMembers, CreateMember, DeleteMember } from '../../domain/usecases/ManageMembers';
import { MemberRepositoryImpl } from '../../data/repositories/MemberRepositoryImpl';
import { CreateMemberInput } from '../../domain/repositories/MemberRepository';

// 依存性注入（DI）
const memberRepository = new MemberRepositoryImpl();
const getMembersUseCase = new GetMembers(memberRepository);
const createMemberUseCase = new CreateMember(memberRepository);
const deleteMemberUseCase = new DeleteMember(memberRepository);

export interface UseMembersResult {
  members: Member[];
  isLoading: boolean;
  error: Error | null;
  createMember: (input: CreateMemberInput) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useMembers = (userId: string): UseMembersResult => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getMembersUseCase.execute(userId);
      setMembers(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreateMember = async (input: CreateMemberInput) => {
    await createMemberUseCase.execute(input);
    await fetchMembers();
  };

  const handleDeleteMember = async (memberId: string) => {
    await deleteMemberUseCase.execute(memberId);
    await fetchMembers();
  };

  return {
    members,
    isLoading,
    error,
    createMember: handleCreateMember,
    deleteMember: handleDeleteMember,
    refetch: fetchMembers,
  };
};
