import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

const mockGetCurrentUser = vi.fn();
const mockFetchAuthSession = vi.fn();
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockConfirmSignUp = vi.fn();
const mockSignOut = vi.fn();

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
  fetchAuthSession: (...args: unknown[]) => mockFetchAuthSession(...args),
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signUp: (...args: unknown[]) => mockSignUp(...args),
  confirmSignUp: (...args: unknown[]) => mockConfirmSignUp(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
  });

  describe('initialize', () => {
    it('認証済みユーザーを初期化できる', async () => {
      mockGetCurrentUser.mockResolvedValueOnce({ userId: 'user-1' });
      mockFetchAuthSession.mockResolvedValueOnce({
        tokens: {
          idToken: {
            payload: { email: 'test@example.com' },
            toString: () => 'mock-token',
          },
        },
      });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.user).toEqual({ userId: 'user-1', email: 'test@example.com' });
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('未認証の場合は初期状態にリセットする', async () => {
      mockGetCurrentUser.mockRejectedValueOnce(new Error('not authenticated'));

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('初期化時にバックエンドにプロフィールを作成する', async () => {
      mockGetCurrentUser.mockResolvedValueOnce({ userId: 'user-1' });
      mockFetchAuthSession.mockResolvedValueOnce({
        tokens: {
          idToken: {
            payload: { email: 'test@example.com' },
            toString: () => 'mock-token',
          },
        },
      });

      await useAuthStore.getState().initialize();

      expect(mockFetch).toHaveBeenCalledWith('/api/users/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify({ displayName: 'test' }),
      });
    });

    it('プロフィール作成に失敗しても初期化は成功する', async () => {
      mockGetCurrentUser.mockResolvedValueOnce({ userId: 'user-1' });
      mockFetchAuthSession.mockResolvedValueOnce({
        tokens: {
          idToken: {
            payload: { email: 'test@example.com' },
            toString: () => 'mock-token',
          },
        },
      });
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('signIn', () => {
    it('サインインして初期化する', async () => {
      mockSignIn.mockResolvedValueOnce({ isSignedIn: true });
      mockGetCurrentUser.mockResolvedValueOnce({ userId: 'user-1' });
      mockFetchAuthSession.mockResolvedValueOnce({
        tokens: {
          idToken: {
            payload: { email: 'test@example.com' },
            toString: () => 'mock-token',
          },
        },
      });

      await useAuthStore.getState().signIn('test@example.com', 'password');

      expect(mockSignIn).toHaveBeenCalledWith({ username: 'test@example.com', password: 'password' });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('サインイン未完了の場合は初期化しない', async () => {
      mockSignIn.mockResolvedValueOnce({ isSignedIn: false });

      await useAuthStore.getState().signIn('test@example.com', 'password');

      expect(mockGetCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('signUp', () => {
    it('サインアップして確認が必要な結果を返す', async () => {
      mockSignUp.mockResolvedValueOnce({ isSignUpComplete: false });

      const result = await useAuthStore.getState().signUp('test@example.com', 'password', 'TestUser');

      expect(mockSignUp).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password',
        options: {
          userAttributes: {
            email: 'test@example.com',
            'custom:displayName': 'TestUser',
          },
        },
      });
      expect(result.needsConfirmation).toBe(true);
    });

    it('サインアップ完了の場合は確認不要', async () => {
      mockSignUp.mockResolvedValueOnce({ isSignUpComplete: true });

      const result = await useAuthStore.getState().signUp('test@example.com', 'password', 'TestUser');

      expect(result.needsConfirmation).toBe(false);
    });
  });

  describe('confirmSignUp', () => {
    it('確認コードを送信できる', async () => {
      mockConfirmSignUp.mockResolvedValueOnce({});

      await useAuthStore.getState().confirmSignUp('test@example.com', '123456');

      expect(mockConfirmSignUp).toHaveBeenCalledWith({
        username: 'test@example.com',
        confirmationCode: '123456',
      });
    });
  });

  describe('signOut', () => {
    it('サインアウトして状態をリセットする', async () => {
      useAuthStore.setState({
        user: { userId: 'user-1', email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      mockSignOut.mockResolvedValueOnce({});

      await useAuthStore.getState().signOut();

      expect(mockSignOut).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('getIdToken', () => {
    it('IDトークンを取得できる', async () => {
      mockFetchAuthSession.mockResolvedValueOnce({
        tokens: {
          idToken: { toString: () => 'id-token-value' },
        },
      });

      const token = await useAuthStore.getState().getIdToken();

      expect(token).toBe('id-token-value');
    });

    it('エラー時にnullを返す', async () => {
      mockFetchAuthSession.mockRejectedValueOnce(new Error('No session'));

      const token = await useAuthStore.getState().getIdToken();

      expect(token).toBeNull();
    });
  });
});
