import { prisma } from '@/lib/prisma';
import { generateLineLinkCode } from '@/lib/line';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';

const LINK_CODE_TTL_MS = 10 * 60 * 1000;

interface LinkStatus {
  linked: boolean;
  pendingCode: string | null;
  pendingExpiresAt: string | null;
  friendAddUrl: string | null;
}

function getFriendAddUrl(): string | null {
  return process.env.LINE_FRIEND_ADD_URL || null;
}

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`line-link-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lineUserId: true, lineLinkCode: true, lineLinkCodeExpiry: true },
  });
  if (!user) return errorResponse('ユーザーが見つかりません', 404);

  const now = new Date();
  const codeValid = user.lineLinkCode && user.lineLinkCodeExpiry && user.lineLinkCodeExpiry > now;

  const status: LinkStatus = {
    linked: Boolean(user.lineUserId),
    pendingCode: codeValid ? user.lineLinkCode : null,
    pendingExpiresAt: codeValid ? user.lineLinkCodeExpiry!.toISOString() : null,
    friendAddUrl: getFriendAddUrl(),
  };
  return success(status);
});

export const POST = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`line-link-post:${userId}`, { maxAttempts: 5, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

  const code = generateLineLinkCode();
  const expiry = new Date(Date.now() + LINK_CODE_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      lineLinkCode: code,
      lineLinkCodeExpiry: expiry,
    },
  });

  return success({
    code,
    expiresAt: expiry.toISOString(),
    friendAddUrl: getFriendAddUrl(),
  });
});

export const DELETE = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`line-link-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { lineUserId: null, lineLinkCode: null, lineLinkCodeExpiry: null },
    }),
    prisma.notificationSetting.upsert({
      where: { userId },
      create: { userId, lineNotificationEnabled: false },
      update: { lineNotificationEnabled: false },
    }),
  ]);

  return success({ unlinked: true });
});
