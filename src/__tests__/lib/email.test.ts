import { describe, it, expect } from 'vitest';
import { emailTemplates, generateVerificationCode } from '@/lib/email';

describe('generateVerificationCode', () => {
  it('6桁の数字文字列を生成する', () => {
    const code = generateVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('100000以上999999以下の値を生成する', () => {
    for (let i = 0; i < 50; i++) {
      const code = parseInt(generateVerificationCode(), 10);
      expect(code).toBeGreaterThanOrEqual(100000);
      expect(code).toBeLessThanOrEqual(999999);
    }
  });
});

describe('emailTemplates', () => {
  describe('verificationCode', () => {
    it('確認コードテンプレートを生成する', () => {
      const result = emailTemplates.verificationCode({ code: '123456' });
      expect(result.subject).toBe('HealthFamily - メールアドレスの確認');
      expect(result.html).toContain('123456');
      expect(result.html).toContain('メールアドレスの確認');
    });

    it('HTMLエスケープが適用される', () => {
      const result = emailTemplates.verificationCode({ code: '<script>alert("xss")</script>' });
      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&lt;script&gt;');
    });
  });

  describe('passwordReset', () => {
    it('パスワードリセットテンプレートを生成する', () => {
      const result = emailTemplates.passwordReset({ code: '654321' });
      expect(result.subject).toBe('HealthFamily - パスワードの再設定');
      expect(result.html).toContain('654321');
      expect(result.html).toContain('パスワードの再設定');
    });
  });

  describe('medicationReminder', () => {
    it('服薬リマインダーテンプレートを生成する', () => {
      const result = emailTemplates.medicationReminder({
        memberName: '太郎',
        medicationName: 'アスピリン',
        scheduledTime: '08:00',
      });
      expect(result.subject).toBe('太郎さんのお薬の時間です');
      expect(result.html).toContain('太郎');
      expect(result.html).toContain('アスピリン');
      expect(result.html).toContain('08:00');
    });

    it('HTMLエスケープが適用される', () => {
      const result = emailTemplates.medicationReminder({
        memberName: '<b>太郎</b>',
        medicationName: 'テスト&薬',
        scheduledTime: '08:00',
      });
      expect(result.html).toContain('&lt;b&gt;太郎&lt;/b&gt;');
      expect(result.html).toContain('テスト&amp;薬');
    });
  });

  describe('missedMedication', () => {
    it('飲み忘れ通知テンプレートを生成する', () => {
      const result = emailTemplates.missedMedication({
        memberName: '花子',
        medicationName: 'ビタミンC',
        scheduledTime: '12:00',
      });
      expect(result.subject).toBe('花子さんのお薬が飲み忘れています');
      expect(result.html).toContain('お薬の飲み忘れ');
      expect(result.html).toContain('花子');
      expect(result.html).toContain('ビタミンC');
    });
  });

  describe('appointmentReminder', () => {
    it('通院リマインダーテンプレートを生成する', () => {
      const result = emailTemplates.appointmentReminder({
        memberName: '太郎',
        hospitalName: '東京病院',
        appointmentDate: '2026-03-01',
      });
      expect(result.subject).toBe('太郎さんの通院予定があります');
      expect(result.html).toContain('東京病院');
      expect(result.html).toContain('2026-03-01');
    });

    it('descriptionがある場合はHTMLに含まれる', () => {
      const result = emailTemplates.appointmentReminder({
        memberName: '太郎',
        hospitalName: '東京病院',
        appointmentDate: '2026-03-01',
        description: '定期検診',
      });
      expect(result.html).toContain('定期検診');
    });

    it('descriptionがない場合はメモ欄を表示しない', () => {
      const result = emailTemplates.appointmentReminder({
        memberName: '太郎',
        hospitalName: '東京病院',
        appointmentDate: '2026-03-01',
      });
      expect(result.html).not.toContain('内容:');
    });
  });

  describe('lowStockAlert', () => {
    it('在庫アラートテンプレートを生成する', () => {
      const result = emailTemplates.lowStockAlert({
        memberName: '太郎',
        medicationName: 'アスピリン',
        currentStock: 3,
        alertDate: '2026-03-05',
        daysUntilAlert: 5,
      });
      expect(result.subject).toBe('アスピリンの在庫が2026-03-05までに不足します');
      expect(result.html).toContain('3日分');
      expect(result.html).toContain('あと5日');
    });
  });
});
