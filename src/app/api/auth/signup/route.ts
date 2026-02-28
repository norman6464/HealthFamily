import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signUpSchema } from '@/lib/schemas';
import { sendEmail, emailTemplates, generateVerificationCode } from '@/lib/email';
import { created, errorResponse } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message);
    }

    const { email, password, displayName } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.emailVerified) {
        return errorResponse('このメールアドレスは既に登録されています');
      }
      // 未認証ユーザーが再登録 → コードを再生成
      const code = generateVerificationCode();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          displayName,
          verificationCode: code,
          verificationExpiry: expiry,
        },
      });

      const template = emailTemplates.verificationCode({ code });
      await sendEmail({ to: email, ...template });

      return created({ email, requiresVerification: true });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName,
        emailVerified: false,
        verificationCode: code,
        verificationExpiry: expiry,
      },
    });

    const template = emailTemplates.verificationCode({ code });
    await sendEmail({ to: email, ...template });

    return created({ email, requiresVerification: true });
  } catch (error) {
    console.error('Signup error:', error);
    return errorResponse('登録に失敗しました', 500);
  }
}
