import { Resend } from 'resend';

let resend: Resend;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = 'HealthFamily <noreply@takushinblog.com>';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const emailTemplates = {
  verificationCode({ code }: { code: string }) {
    return {
      subject: 'HealthFamily - メールアドレスの確認',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #16a34a; margin-bottom: 16px;">メールアドレスの確認</h2>
          <p style="font-size: 14px; color: #374151; margin-bottom: 16px;">HealthFamilyへのご登録ありがとうございます。以下の確認コードを入力してください。</p>
          <div style="background: #f0fdf4; border-radius: 8px; padding: 24px; margin-bottom: 16px; text-align: center;">
            <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">${code}</p>
          </div>
          <p style="font-size: 13px; color: #6b7280;">このコードは10分間有効です。</p>
          <p style="font-size: 13px; color: #6b7280;">HealthFamily - 今お薬飲んでよ通知アプリ</p>
        </div>
      `,
    };
  },

  medicationReminder({
    memberName,
    medicationName,
    scheduledTime,
  }: {
    memberName: string;
    medicationName: string;
    scheduledTime: string;
  }) {
    return {
      subject: `${memberName}さんのお薬の時間です`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #16a34a; margin-bottom: 16px;">お薬の時間です</h2>
          <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>${memberName}</strong>さん</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">お薬: <strong>${medicationName}</strong></p>
            <p style="margin: 0; font-size: 14px; color: #374151;">予定時刻: <strong>${scheduledTime}</strong></p>
          </div>
          <p style="font-size: 13px; color: #6b7280;">HealthFamily - 今お薬飲んでよ通知アプリ</p>
        </div>
      `,
    };
  },

  missedMedication({
    memberName,
    medicationName,
    scheduledTime,
  }: {
    memberName: string;
    medicationName: string;
    scheduledTime: string;
  }) {
    return {
      subject: `${memberName}さんのお薬が飲み忘れています`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #dc2626; margin-bottom: 16px;">お薬の飲み忘れ</h2>
          <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>${memberName}</strong>さん</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">お薬: <strong>${medicationName}</strong></p>
            <p style="margin: 0; font-size: 14px; color: #374151;">予定時刻: <strong>${scheduledTime}</strong></p>
          </div>
          <p style="font-size: 14px; color: #374151;">まだお薬を服用していないようです。忘れずに服用してください。</p>
          <p style="font-size: 13px; color: #6b7280;">HealthFamily - 今お薬飲んでよ通知アプリ</p>
        </div>
      `,
    };
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
  }) {
    return {
      subject: `${memberName}さんの通院予定があります`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #2563eb; margin-bottom: 16px;">通院リマインダー</h2>
          <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>${memberName}</strong>さん</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">病院: <strong>${hospitalName}</strong></p>
            <p style="margin: 0; font-size: 14px; color: #374151;">日時: <strong>${appointmentDate}</strong></p>
            ${description ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;">内容: ${description}</p>` : ''}
          </div>
          <p style="font-size: 13px; color: #6b7280;">HealthFamily - 今お薬飲んでよ通知アプリ</p>
        </div>
      `,
    };
  },

  lowStockAlert({
    memberName,
    medicationName,
    currentStock,
    threshold,
  }: {
    memberName: string;
    medicationName: string;
    currentStock: number;
    threshold: number;
  }) {
    return {
      subject: `${medicationName}の残数が少なくなっています`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #d97706; margin-bottom: 16px;">お薬の残数アラート</h2>
          <div style="background: #fffbeb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>${memberName}</strong>さん</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">お薬: <strong>${medicationName}</strong></p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">残数: <strong style="color: #dc2626;">${currentStock}</strong> / 閾値: ${threshold}</p>
          </div>
          <p style="font-size: 14px; color: #374151;">早めにかかりつけ医に相談し、処方を受けてください。</p>
          <p style="font-size: 13px; color: #6b7280;">HealthFamily - 今お薬飲んでよ通知アプリ</p>
        </div>
      `,
    };
  },
};
