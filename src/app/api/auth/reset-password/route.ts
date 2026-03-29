import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';
import { validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { timingSafeEqual, checkRateLimit } from '@/lib/security';

const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().max(254, 'メールアドレスが長すぎます').email('有効なメールアドレスを入力してください'),
  code: z.string().trim().length(6, 'リセットコードは6桁で入力してください'),
  newPassword: z.string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(128, 'パスワードは128文字以内で入力してください')
    .regex(/[a-zA-Z]/, 'パスワードには英字を含めてください')
    .regex(/[0-9]/, 'パスワードには数字を含めてください')
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/, 'パスワードには記号を含めてください'),
});

export async function POST(request: NextRequest) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  try {
    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const parsed = resetPasswordSchema.safeParse(jsonResult.data);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { email, code, newPassword } = parsed.data;

    const rateLimit = checkRateLimit(`reset:${email}`, { maxAttempts: 5, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return errorResponse('リセットコードが無効です');
    }

    if (!timingSafeEqual(user.resetCode, code)) {
      return errorResponse('リセットコードが正しくありません');
    }

    if (new Date() > user.resetCodeExpiry) {
      return errorResponse('リセットコードの有効期限が切れています');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiry: null,
      },
    });

    return success({ message: 'パスワードを再設定しました' });
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    return errorResponse('再設定に失敗しました', 500);
  }
}
