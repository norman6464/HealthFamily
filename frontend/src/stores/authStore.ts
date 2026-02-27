import { create } from 'zustand';
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';

interface AuthUser {
  userId: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ needsConfirmation: boolean }>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;
      const user = {
        userId: currentUser.userId,
        email: (idToken?.payload?.email as string) || '',
      };
      set({ user, isAuthenticated: true, isLoading: false });

      // Ensure user profile exists in backend
      try {
        const token = idToken?.toString();
        if (token) {
          await fetch('/api/users/me', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ displayName: user.email.split('@')[0] }),
          });
        }
      } catch {
        // Profile creation is best-effort
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    const result = await amplifySignIn({ username: email, password });
    if (result.isSignedIn) {
      await get().initialize();
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    const result = await amplifySignUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          'custom:displayName': displayName,
        },
      },
    });
    return {
      needsConfirmation: !result.isSignUpComplete,
    };
  },

  confirmSignUp: async (email: string, code: string) => {
    await amplifyConfirmSignUp({ username: email, confirmationCode: code });
  },

  signOut: async () => {
    await amplifySignOut();
    set({ user: null, isAuthenticated: false });
  },

  getIdToken: async () => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch {
      return null;
    }
  },
}));
