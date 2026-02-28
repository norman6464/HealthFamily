import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailTemplates, generateVerificationCode } from '@/lib/email';
import { success, errorResponse } from '@/lib/auth-helpers';

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('有効なメールアドレスを入力してください');
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse('ユーザーが見つかりません', 404);
    }

    if (user.emailVerified) {
      return success({ message: '既に認証済みです' });
    }

    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { verificationCode: code, verificationExpiry: expiry },
    });

    const template = emailTemplates.verificationCode({ code });
    await sendEmail({ to: email, ...template });

    return success({ message: '確認コードを再送信しました' });
  } catch (error) {
    console.error('Resend code error:', error);
    return errorResponse('再送信に失敗しました', 500);
  }
}
