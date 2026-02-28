import { auth } from './auth';
import { NextResponse } from 'next/server';

export async function getAuthUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function success(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created(data: unknown) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function notFound(resource: string) {
  return NextResponse.json(
    { success: false, error: `${resource}が見つかりません` },
    { status: 404 }
  );
}

export function unauthorized() {
  return NextResponse.json(
    { success: false, error: '認証エラー' },
    { status: 401 }
  );
}
