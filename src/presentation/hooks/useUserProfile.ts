/**
 * ユーザープロフィール管理カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useMemo } from 'react';
import { UserProfile, UpdateUserProfileInput } from '../../domain/repositories/UserProfileRepository';
import { GetUserProfile, UpdateUserProfile } from '../../domain/usecases/ManageUserProfile';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseUserProfileResult {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  updateProfile: (input: UpdateUserProfileInput) => Promise<UserProfile>;
  refetch: () => Promise<void>;
}

export const useUserProfile = (): UseUserProfileResult => {
  const useCases = useMemo(() => {
    const { userProfileRepository } = getDIContainer();
    return {
      getProfile: new GetUserProfile(userProfileRepository),
      updateProfile: new UpdateUserProfile(userProfileRepository),
    };
  }, []);

  const { data: profile, isLoading, error, refetch } = useFetcher(
    () => useCases.getProfile.execute(),
    [useCases],
    null as UserProfile | null,
  );

  const handleUpdateProfile = async (input: UpdateUserProfileInput): Promise<UserProfile> => {
    const updated = await useCases.updateProfile.execute(input);
    await refetch();
    return updated;
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile: handleUpdateProfile,
    refetch,
  };
};
