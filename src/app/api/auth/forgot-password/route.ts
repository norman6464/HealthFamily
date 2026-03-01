import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailTemplates, generateVerificationCode } from '@/lib/email';
import { success, errorResponse } from '@/lib/auth-helpers';
import { checkRateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email ?? '').trim().toLowerCase();

    if (!email) {
      return errorResponse('メールアドレスを入力してください');
    }

    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const rateLimit = checkRateLimit(`forgot:${ip}`, { maxAttempts: 5, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // ユーザーが存在しなくても成功レスポンスを返す（セキュリティ対策）
    if (!user) {
      return success({ message: 'リセットコードを送信しました' });
    }

    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { resetCode: code, resetCodeExpiry: expiry },
    });

    const template = emailTemplates.passwordReset({ code });
    await sendEmail({ to: email, ...template });

    return success({ message: 'リセットコードを送信しました' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse('送信に失敗しました', 500);
  }
}
