import { auth } from './auth';
import { NextResponse } from 'next/server';
import { NotFoundError, ConflictError, ValidationError, DomainError } from '@/domain/errors';

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

/**
 * ドメイン例外をHTTPレスポンスにマッピングする共通エラーハンドラ
 */
export function handleDomainError(error: unknown): NextResponse {
  if (error instanceof NotFoundError) {
    return errorResponse(error.message, 404);
  }
  if (error instanceof ConflictError) {
    return errorResponse(error.message, 409);
  }
  if (error instanceof ValidationError) {
    return errorResponse(error.message, 400);
  }
  if (error instanceof DomainError) {
    return errorResponse(error.message, 400);
  }
  // 未知のエラーはログに出力し、クライアントには一般的なメッセージを返す
  console.error('Unhandled error:', error);
  return errorResponse('サーバーエラーが発生しました', 500);
}
