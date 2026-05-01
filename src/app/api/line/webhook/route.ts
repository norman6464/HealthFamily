import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyLineSignature,
  sendLineReplyMessage,
  lineMessageTemplates,
} from '@/lib/line';

interface LineMessageEvent {
  type: 'message';
  replyToken: string;
  source: { type: string; userId?: string };
  message: { type: string; text?: string };
}

interface LineFollowEvent {
  type: 'follow';
  replyToken: string;
  source: { type: string; userId?: string };
}

interface LineUnfollowEvent {
  type: 'unfollow';
  source: { type: string; userId?: string };
}

type LineEvent = LineMessageEvent | LineFollowEvent | LineUnfollowEvent | { type: string };

function ok() {
  return NextResponse.json({ success: true });
}

async function handleFollowEvent(event: LineFollowEvent): Promise<void> {
  if (!event.replyToken) return;
  await sendLineReplyMessage(event.replyToken, lineMessageTemplates.linkInstruction()).catch(() => {});
}

async function handleUnfollowEvent(event: LineUnfollowEvent): Promise<void> {
  const lineUserId = event.source.userId;
  if (!lineUserId) return;
  await prisma.user.updateMany({
    where: { lineUserId },
    data: { lineUserId: null, lineLinkCode: null, lineLinkCodeExpiry: null },
  });
}

async function handleMessageEvent(event: LineMessageEvent): Promise<void> {
  const lineUserId = event.source.userId;
  const text = event.message.text?.trim();
  if (!lineUserId || !text) return;

  const codeMatch = text.match(/^\d{6}$/);
  if (!codeMatch) {
    await sendLineReplyMessage(event.replyToken, lineMessageTemplates.linkInstruction()).catch(() => {});
    return;
  }

  const code = codeMatch[0];
  const now = new Date();
  const user = await prisma.user.findFirst({
    where: {
      lineLinkCode: code,
      lineLinkCodeExpiry: { gt: now },
    },
    select: { id: true, displayName: true, lineUserId: true },
  });

  if (!user) {
    await sendLineReplyMessage(event.replyToken, lineMessageTemplates.linkInvalid()).catch(() => {});
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.updateMany({
      where: { lineUserId, NOT: { id: user.id } },
      data: { lineUserId: null },
    });
    await tx.user.update({
      where: { id: user.id },
      data: {
        lineUserId,
        lineLinkCode: null,
        lineLinkCodeExpiry: null,
      },
    });
    await tx.notificationSetting.upsert({
      where: { userId: user.id },
      create: { userId: user.id, lineNotificationEnabled: true },
      update: { lineNotificationEnabled: true },
    });
  });

  await sendLineReplyMessage(
    event.replyToken,
    lineMessageTemplates.linkSuccess(user.displayName),
  ).catch(() => {});
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-line-signature');

  if (!verifyLineSignature(rawBody, signature)) {
    return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
  }

  let payload: { events?: LineEvent[] };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const events = payload.events ?? [];
  for (const event of events) {
    try {
      if (event.type === 'follow') {
        await handleFollowEvent(event as LineFollowEvent);
      } else if (event.type === 'unfollow') {
        await handleUnfollowEvent(event as LineUnfollowEvent);
      } else if (event.type === 'message' && (event as LineMessageEvent).message.type === 'text') {
        await handleMessageEvent(event as LineMessageEvent);
      }
    } catch (error) {
      console.error('LINE webhook event handler failed', error);
    }
  }

  return ok();
}
