'use client';

import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    userId: session?.user?.id ?? '',
    email: session?.user?.email ?? '',
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
}
