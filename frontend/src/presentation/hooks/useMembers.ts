/**
 * メンバー管理カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Member } from '../../domain/entities/Member';
import { GetMembers, CreateMember, DeleteMember } from '../../domain/usecases/ManageMembers';
import { CreateMemberInput } from '../../domain/repositories/MemberRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';

export interface UseMembersResult {
  members: Member[];
  isLoading: boolean;
  error: Error | null;
  createMember: (input: CreateMemberInput) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useMembers = (userId: string): UseMembersResult => {
  const useCases = useMemo(() => {
    const { memberRepository } = getDIContainer();
    return {
      getMembers: new GetMembers(memberRepository),
      createMember: new CreateMember(memberRepository),
      deleteMember: new DeleteMember(memberRepository),
    };
  }, []);

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await useCases.getMembers.execute(userId);
      setMembers(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, useCases]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreateMember = async (input: CreateMemberInput) => {
    await useCases.createMember.execute(input);
    await fetchMembers();
  };

  const handleDeleteMember = async (memberId: string) => {
    await useCases.deleteMember.execute(memberId);
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
