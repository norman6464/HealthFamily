/**
 * メンバー管理カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useCallback, useMemo } from 'react';
import { Member } from '../../domain/entities/Member';
import { GetMembers, CreateMember, UpdateMember, DeleteMember } from '../../domain/usecases/ManageMembers';
import { CreateMemberInput, UpdateMemberInput } from '../../domain/repositories/MemberRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseMembersResult {
  members: Member[];
  isLoading: boolean;
  error: Error | null;
  createMember: (input: CreateMemberInput) => Promise<void>;
  updateMember: (memberId: string, input: UpdateMemberInput) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useMembers = (userId: string): UseMembersResult => {
  const useCases = useMemo(() => {
    const { memberRepository } = getDIContainer();
    return {
      getMembers: new GetMembers(memberRepository),
      createMember: new CreateMember(memberRepository),
      updateMember: new UpdateMember(memberRepository),
      deleteMember: new DeleteMember(memberRepository),
    };
  }, []);

  const { data: members, isLoading, error, refetch } = useFetcher(
    () => useCases.getMembers.execute(userId),
    [userId, useCases],
    [] as Member[],
  );

  const handleCreateMember = useCallback(async (input: CreateMemberInput) => {
    await useCases.createMember.execute(input);
    await refetch();
  }, [useCases, refetch]);

  const handleUpdateMember = useCallback(async (memberId: string, input: UpdateMemberInput) => {
    await useCases.updateMember.execute(memberId, input);
    await refetch();
  }, [useCases, refetch]);

  const handleDeleteMember = useCallback(async (memberId: string) => {
    await useCases.deleteMember.execute(memberId);
    await refetch();
  }, [useCases, refetch]);

  return {
    members,
    isLoading,
    error,
    createMember: handleCreateMember,
    updateMember: handleUpdateMember,
    deleteMember: handleDeleteMember,
    refetch,
  };
};
