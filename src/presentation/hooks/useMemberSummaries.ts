/**
 * メンバーサマリー取得フック
 */

import { useMemo } from 'react';
import { MemberSummary } from '../../domain/entities/MemberSummary';
import { GetMemberSummaries } from '../../domain/usecases/ManageMembers';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseMemberSummariesResult {
  summaries: MemberSummary[];
  isLoading: boolean;
  error: Error | null;
}

export const useMemberSummaries = (): UseMemberSummariesResult => {
  const useCase = useMemo(() => {
    const { memberRepository } = getDIContainer();
    return new GetMemberSummaries(memberRepository);
  }, []);

  const { data, isLoading, error } = useFetcher(
    () => useCase.execute(),
    [useCase],
    [] as MemberSummary[],
  );

  return { summaries: data, isLoading, error };
};
