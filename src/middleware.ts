export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/((?!login|signup|api/auth|_next/static|_next/image|favicon.ico).*)'],
};
