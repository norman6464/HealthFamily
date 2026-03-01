/**
 * ユーザープロフィールリポジトリインターフェース
 */

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  characterType: string;
  characterName: string | null;
}

export interface UpdateUserProfileInput {
  displayName?: string;
}

export interface UserProfileRepository {
  getProfile(): Promise<UserProfile>;
  updateProfile(input: UpdateUserProfileInput): Promise<UserProfile>;
}
