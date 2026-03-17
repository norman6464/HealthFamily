import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailTemplates, generateVerificationCode } from '@/lib/email';
import { forgotPasswordSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  try {
    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const parsed = forgotPasswordSchema.safeParse(jsonResult.data);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const email = parsed.data.email;

    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const ipLimit = checkRateLimit(`forgot:${ip}`, { maxAttempts: 5, windowMs: 60 * 1000 });
    if (!ipLimit.allowed) {
      return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    }
    const emailLimit = checkRateLimit(`forgot-email:${email}`, { maxAttempts: 3, windowMs: 60 * 1000 });
    if (!emailLimit.allowed) {
      return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // ユーザーが存在しなくても成功レスポンスを返す（セキュリティ対策）
    if (!user) {
      return success({ message: 'リセットコードを送信しました' });
    }

    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    try {
      await prisma.user.update({
        where: { email },
        data: { resetCode: code, resetCodeExpiry: expiry },
      });
    } catch (dbError) {
      console.error('パスワード再設定 DB更新エラー:', dbError instanceof Error ? dbError.message : dbError);
      return errorResponse('サーバーエラーが発生しました。しばらくしてから再試行してください。', 500);
    }

    try {
      const template = emailTemplates.passwordReset({ code });
      await sendEmail({ to: email, ...template });
    } catch (emailError) {
      console.error('パスワード再設定 メール送信エラー:', emailError instanceof Error ? emailError.message : emailError);
      // メール送信失敗時はリセットコードをクリア
      await prisma.user.update({
        where: { email },
        data: { resetCode: null, resetCodeExpiry: null },
      }).catch(() => {});
      return errorResponse('メールの送信に失敗しました。しばらくしてから再試行してください。', 500);
    }

    return success({ message: 'リセットコードを送信しました' });
  } catch (error) {
    console.error('パスワード再設定エラー:', error instanceof Error ? error.message : error);
    return errorResponse('送信に失敗しました。しばらくしてから再試行してください。', 500);
  }
}
