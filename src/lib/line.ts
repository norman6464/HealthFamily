import crypto from 'crypto';

const LINE_PUSH_API = 'https://api.line.me/v2/bot/message/push';
const LINE_REPLY_API = 'https://api.line.me/v2/bot/message/reply';

function getChannelAccessToken(): string {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
  }
  return token;
}

function getChannelSecret(): string {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) {
    throw new Error('LINE_CHANNEL_SECRET is not set');
  }
  return secret;
}

export interface LineTextMessage {
  type: 'text';
  text: string;
}

export async function sendLinePushMessage(lineUserId: string, text: string): Promise<void> {
  const message: LineTextMessage = { type: 'text', text };
  const res = await fetch(LINE_PUSH_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getChannelAccessToken()}`,
    },
    body: JSON.stringify({ to: lineUserId, messages: [message] }),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Failed to send LINE message: ${res.status} ${errorText}`);
  }
}

export async function sendLineReplyMessage(replyToken: string, text: string): Promise<void> {
  const message: LineTextMessage = { type: 'text', text };
  const res = await fetch(LINE_REPLY_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getChannelAccessToken()}`,
    },
    body: JSON.stringify({ replyToken, messages: [message] }),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Failed to send LINE reply: ${res.status} ${errorText}`);
  }
}

export function verifyLineSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', getChannelSecret());
  hmac.update(rawBody);
  const expected = hmac.digest('base64');
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function generateLineLinkCode(): string {
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0);
  return (100000 + (num % 900000)).toString();
}

export const lineMessageTemplates = {
  medicationReminder({
    memberName,
    medicationName,
    scheduledTime,
  }: {
    memberName: string;
    medicationName: string;
    scheduledTime: string;
  }): string {
    return [
      'お薬の時間です',
      '',
      `${memberName}さん`,
      `お薬: ${medicationName}`,
      `予定時刻: ${scheduledTime}`,
      '',
      'HealthFamily',
    ].join('\n');
  },

  missedMedication({
    memberName,
    medicationName,
    scheduledTime,
  }: {
    memberName: string;
    medicationName: string;
    scheduledTime: string;
  }): string {
    return [
      'お薬の飲み忘れ',
      '',
      `${memberName}さん`,
      `お薬: ${medicationName}`,
      `予定時刻: ${scheduledTime}`,
      '',
      'まだお薬を服用していないようです。忘れずに服用してください。',
      '',
      'HealthFamily',
    ].join('\n');
  },

  appointmentReminder({
    memberName,
    hospitalName,
    appointmentDate,
    description,
  }: {
    memberName: string;
    hospitalName: string;
    appointmentDate: string;
    description?: string;
  }): string {
    const lines = [
      '通院リマインダー',
      '',
      `${memberName}さん`,
      `病院: ${hospitalName}`,
      `日時: ${appointmentDate}`,
    ];
    if (description) lines.push(`内容: ${description}`);
    lines.push('', 'HealthFamily');
    return lines.join('\n');
  },

  lowStockAlert({
    memberName,
    medicationName,
    currentStock,
    alertDate,
    daysUntilAlert,
  }: {
    memberName: string;
    medicationName: string;
    currentStock: number;
    alertDate: string;
    daysUntilAlert: number;
  }): string {
    return [
      'お薬の在庫アラート',
      '',
      `${memberName}さん`,
      `お薬: ${medicationName}`,
      `現在の在庫: ${currentStock}日分`,
      `警告日: ${alertDate} (あと${daysUntilAlert}日)`,
      '',
      '在庫が警告日までに不足する見込みです。早めにかかりつけ医に相談し、処方を受けてください。',
      '',
      'HealthFamily',
    ].join('\n');
  },

  linkSuccess(displayName: string | null): string {
    const name = displayName ? `${displayName}さん、` : '';
    return [
      'LINE連携が完了しました',
      '',
      `${name}HealthFamilyからの通知をこのトークルームでお届けします。`,
      '通知の種類は設定画面から変更できます。',
    ].join('\n');
  },

  linkInvalid(): string {
    return [
      '連携コードが無効です',
      '',
      '6桁のコードを正しく入力するか、設定画面でコードを再生成してください。',
      'コードの有効期限は10分です。',
    ].join('\n');
  },

  linkInstruction(): string {
    return [
      'HealthFamilyへようこそ',
      '',
      'アプリの「設定 > 通知設定 > LINE連携」で6桁のコードを発行し、このトークに送信してください。',
    ].join('\n');
  },
};
