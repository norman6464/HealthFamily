import { Resend } from 'resend';
import { escapeHtml } from './security';

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
    const e = escapeHtml(code);
    return {
      subject: 'HealthFamily - メールアドレスの確認',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #16a34a; margin-bottom: 16px;">メールアドレスの確認</h2>
          <p style="font-size: 14px; color: #374151; margin-bottom: 16px;">HealthFamilyへのご登録ありがとうございます。以下の確認コードを入力してください。</p>
          <div style="background: #f0fdf4; border-radius: 8px; padding: 24px; margin-bottom: 16px; text-align: center;">
            <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">${e}</p>
          </div>
          <p style="font-size: 13px; color: #6b7280;">このコードは10分間有効です。</p>
          <p style="font-size: 13px; color: #6b7280;">HealthFamily - 今お薬飲んでよ通知アプリ</p>
        </div>
      `,
    };
  },

  passwordReset({ code }: { code: string }) {
    const e = escapeHtml(code);
    return {
      subject: 'HealthFamily - パスワードの再設定',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #16a34a; margin-bottom: 16px;">パスワードの再設定</h2>
          <p style="font-size: 14px; color: #374151; margin-bottom: 16px;">以下のリセットコードを入力して、新しいパスワードを設定してください。</p>
          <div style="background: #f0fdf4; border-radius: 8px; padding: 24px; margin-bottom: 16px; text-align: center;">
            <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">${e}</p>
          </div>
          <p style="font-size: 13px; color: #6b7280;">このコードは10分間有効です。</p>
          <p style="font-size: 13px; color: #6b7280;">心当たりがない場合は、このメールを無視してください。</p>
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
    const m = escapeHtml(memberName);
    const med = escapeHtml(medicationName);
    const t = escapeHtml(scheduledTime);
    return {
      subject: `${m}さんのお薬の時間です`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #16a34a; margin-bottom: 16px;">お薬の時間です</h2>
          <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>${m}</strong>さん</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">お薬: <strong>${med}</strong></p>
            <p style="margin: 0; font-size: 14px; color: #374151;">予定時刻: <strong>${t}</strong></p>
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
    const m = escapeHtml(memberName);
    const med = escapeHtml(medicationName);
    const t = escapeHtml(scheduledTime);
    return {
      subject: `${m}さんのお薬が飲み忘れています`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #dc2626; margin-bottom: 16px;">お薬の飲み忘れ</h2>
          <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>${m}</strong>さん</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">お薬: <strong>${med}</strong></p>
            <p style="margin: 0; font-size: 14px; color: #374151;">予定時刻: <strong>${t}</strong></p>
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
    const m = escapeHtml(memberName);
    const h = escapeHtml(hospitalName);
    const d = escapeHtml(appointmentDate);
    const desc = description ? escapeHtml(description) : '';
    return {
      subject: `${m}さんの通院予定があります`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #2563eb; margin-bottom: 16px;">通院リマインダー</h2>
          <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>${m}</strong>さん</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">病院: <strong>${h}</strong></p>
            <p style="margin: 0; font-size: 14px; color: #374151;">日時: <strong>${d}</strong></p>
            ${desc ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;">内容: ${desc}</p>` : ''}
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
    alertDate,
    daysUntilAlert,
  }: {
    memberName: string;
    medicationName: string;
    currentStock: number;
    alertDate: string;
    daysUntilAlert: number;
  }) {
    const m = escapeHtml(memberName);
    const med = escapeHtml(medicationName);
    const ad = escapeHtml(alertDate);
    return {
      subject: `${med}の在庫が${ad}までに不足します`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #d97706; margin-bottom: 16px;">お薬の在庫アラート</h2>
          <div style="background: #fffbeb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>${m}</strong>さん</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">お薬: <strong>${med}</strong></p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">現在の在庫: <strong style="color: #dc2626;">${currentStock}日分</strong></p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">警告日: <strong>${ad}</strong>(あと${daysUntilAlert}日)</p>
          </div>
          <p style="font-size: 14px; color: #374151;">在庫が警告日までに不足する見込みです。早めにかかりつけ医に相談し、処方を受けてください。</p>
          <p style="font-size: 13px; color: #6b7280;">HealthFamily - 今お薬飲んでよ通知アプリ</p>
        </div>
      `,
    };
  },
};
