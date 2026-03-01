/**
 * ユーザープロフィール管理ユースケース
 */

import {
  UserProfileRepository,
  UserProfile,
  UpdateUserProfileInput,
} from '../repositories/UserProfileRepository';

export class GetUserProfile {
  constructor(private readonly userProfileRepository: UserProfileRepository) {}

  async execute(): Promise<UserProfile> {
    return this.userProfileRepository.getProfile();
  }
}

export class UpdateUserProfile {
  constructor(private readonly userProfileRepository: UserProfileRepository) {}

  async execute(input: UpdateUserProfileInput): Promise<UserProfile> {
    if (input.displayName !== undefined && !input.displayName.trim()) {
      throw new Error('表示名は空にできません');
    }
    return this.userProfileRepository.updateProfile(input);
  }
}
