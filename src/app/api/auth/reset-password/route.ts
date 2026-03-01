import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email ?? '').trim().toLowerCase();
    const code = body.code;
    const newPassword = body.newPassword;

    if (!email || !code || !newPassword) {
      return errorResponse('必須項目を入力してください');
    }

    if (newPassword.length < 8) {
      return errorResponse('パスワードは8文字以上で入力してください');
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return errorResponse('リセットコードが無効です');
    }

    if (user.resetCode !== code) {
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
    console.error('Reset password error:', error);
    return errorResponse('再設定に失敗しました', 500);
  }
}
