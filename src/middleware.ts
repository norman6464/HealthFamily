import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ['/((?!login|signup|verify|forgot-password|reset-password|api/auth|_next/static|_next/image|favicon.ico).*)'],
};
