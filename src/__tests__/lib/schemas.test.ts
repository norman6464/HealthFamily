import { describe, it, expect } from 'vitest';
import {
  signUpSchema,
  createMemberSchema,
  updateMemberSchema,
  createMedicationSchema,
  updateMedicationSchema,
  createScheduleSchema,
  createRecordSchema,
  createHospitalSchema,
  createAppointmentSchema,
  updateStockSchema,
} from '@/lib/schemas';

describe('signUpSchema', () => {
  it('有効なデータを受け入れる', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: '12345678',
      displayName: 'テストユーザー',
    });
    expect(result.success).toBe(true);
  });

  it('無効なメールアドレスを拒否する', () => {
    const result = signUpSchema.safeParse({
      email: 'invalid-email',
      password: '12345678',
      displayName: 'テスト',
    });
    expect(result.success).toBe(false);
  });

  it('短すぎるパスワードを拒否する', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: '1234567',
      displayName: 'テスト',
    });
    expect(result.success).toBe(false);
  });

  it('空の表示名を拒否する', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: '12345678',
      displayName: '',
    });
    expect(result.success).toBe(false);
  });

  it('メールアドレスを小文字に正規化する', () => {
    const result = signUpSchema.safeParse({
      email: 'Test@Example.COM',
      password: '12345678',
      displayName: 'テスト',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('メールアドレスの前後の空白を除去する', () => {
    const result = signUpSchema.safeParse({
      email: '  test@example.com  ',
      password: '12345678',
      displayName: 'テスト',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('表示名の前後の空白を除去する', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: '12345678',
      displayName: '  テスト  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe('テスト');
    }
  });
});

describe('createMemberSchema', () => {
  it('名前のみで有効', () => {
    const result = createMemberSchema.safeParse({ name: 'テスト太郎' });
    expect(result.success).toBe(true);
  });

  it('空の名前を拒否する', () => {
    const result = createMemberSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('全フィールドを受け入れる', () => {
    const result = createMemberSchema.safeParse({
      name: 'ポチ',
      memberType: 'pet',
      petType: 'dog',
      birthDate: '2020-01-01',
      notes: 'テストメモ',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateMemberSchema', () => {
  it('名前のみの更新を受け入れる', () => {
    const result = updateMemberSchema.safeParse({ name: '更新名' });
    expect(result.success).toBe(true);
  });

  it('空のオブジェクトを拒否する', () => {
    const result = updateMemberSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('nullのnotesを受け入れる', () => {
    const result = updateMemberSchema.safeParse({ notes: null });
    expect(result.success).toBe(true);
  });
});

describe('createMedicationSchema', () => {
  it('名前のみで有効', () => {
    const result = createMedicationSchema.safeParse({ name: 'テスト薬' });
    expect(result.success).toBe(true);
  });

  it('空の名前を拒否する', () => {
    const result = createMedicationSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('負の在庫数を拒否する', () => {
    const result = createMedicationSchema.safeParse({ name: 'テスト薬', stockQuantity: -1 });
    expect(result.success).toBe(false);
  });
});

describe('updateMedicationSchema', () => {
  it('名前のみの更新を受け入れる', () => {
    const result = updateMedicationSchema.safeParse({ name: '更新薬名' });
    expect(result.success).toBe(true);
  });

  it('空のオブジェクトを拒否する', () => {
    const result = updateMedicationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('nullの在庫数を受け入れる', () => {
    const result = updateMedicationSchema.safeParse({ stockQuantity: null });
    expect(result.success).toBe(true);
  });

  it('負の在庫数を拒否する', () => {
    const result = updateMedicationSchema.safeParse({ stockQuantity: -1 });
    expect(result.success).toBe(false);
  });
});

describe('createScheduleSchema', () => {
  it('有効なスケジュールを受け入れる', () => {
    const result = createScheduleSchema.safeParse({
      medicationId: 'med-1',
      memberId: 'member-1',
      scheduledTime: '08:00',
    });
    expect(result.success).toBe(true);
  });

  it('薬IDがない場合を拒否する', () => {
    const result = createScheduleSchema.safeParse({
      medicationId: '',
      memberId: 'member-1',
      scheduledTime: '08:00',
    });
    expect(result.success).toBe(false);
  });
});

describe('createRecordSchema', () => {
  it('有効な記録を受け入れる', () => {
    const result = createRecordSchema.safeParse({
      memberId: 'member-1',
      medicationId: 'med-1',
    });
    expect(result.success).toBe(true);
  });
});

describe('createHospitalSchema', () => {
  it('病院名のみで有効', () => {
    const result = createHospitalSchema.safeParse({ name: 'テスト病院' });
    expect(result.success).toBe(true);
  });
});

describe('createAppointmentSchema', () => {
  it('有効な予約を受け入れる', () => {
    const result = createAppointmentSchema.safeParse({
      memberId: 'member-1',
      appointmentDate: '2024-06-01',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateStockSchema', () => {
  it('0以上の在庫数を受け入れる', () => {
    expect(updateStockSchema.safeParse({ stockQuantity: 0 }).success).toBe(true);
    expect(updateStockSchema.safeParse({ stockQuantity: 10 }).success).toBe(true);
  });

  it('負の在庫数を拒否する', () => {
    expect(updateStockSchema.safeParse({ stockQuantity: -1 }).success).toBe(false);
  });
});
