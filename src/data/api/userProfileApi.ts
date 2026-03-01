import { UserProfile, UpdateUserProfileInput } from '../../domain/repositories/UserProfileRepository';
import { apiClient } from './apiClient';

export const userProfileApi = {
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/users/me');
  },

  async updateProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
    return apiClient.put<UserProfile>('/users/me', input);
  },
};
