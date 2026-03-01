import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().length(6),
});

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('確認コードは6桁の数字です');
    }

    const { email, code } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse('ユーザーが見つかりません', 404);
    }

    if (user.emailVerified) {
      return success({ message: '既に認証済みです' });
    }

    if (!user.verificationCode || !user.verificationExpiry) {
      return errorResponse('確認コードが発行されていません');
    }

    if (new Date() > user.verificationExpiry) {
      return errorResponse('確認コードの有効期限が切れています。再送信してください。');
    }

    // 試行回数の確認
    const attempts = user.verificationAttempts ?? 0;
    if (attempts >= MAX_ATTEMPTS) {
      return errorResponse('試行回数の上限に達しました。確認コードを再送信してください。');
    }

    if (user.verificationCode !== code) {
      // 試行回数をインクリメント
      await prisma.user.update({
        where: { email },
        data: { verificationAttempts: attempts + 1 },
      });
      return errorResponse('確認コードが正しくありません');
    }

    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationExpiry: null,
        verificationAttempts: 0,
      },
    });

    return success({ message: 'メールアドレスが確認されました' });
  } catch (error) {
    console.error('Verify error:', error);
    return errorResponse('認証に失敗しました', 500);
  }
}
