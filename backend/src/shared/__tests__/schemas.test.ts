import { describe, it, expect } from 'vitest';
import {
  createMemberSchema,
  createMedicationSchema,
  updateStockSchema,
  createScheduleSchema,
  updateScheduleSchema,
  createRecordSchema,
  createHospitalSchema,
  updateHospitalSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
} from '../schemas';

describe('Zodスキーマバリデーション', () => {
  describe('createMemberSchema', () => {
    it('有効なデータを受け入れる', () => {
      const result = createMemberSchema.safeParse({ name: '太郎', memberType: 'human' });
      expect(result.success).toBe(true);
    });

    it('名前が空の場合はエラー', () => {
      const result = createMemberSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('名前がない場合はエラー', () => {
      const result = createMemberSchema.safeParse({ memberType: 'human' });
      expect(result.success).toBe(false);
    });

    it('不明なフィールドを除外する', () => {
      const result = createMemberSchema.safeParse({ name: '太郎', admin: true });
      expect(result.success).toBe(true);
      expect((result as { success: true; data: Record<string, unknown> }).data.admin).toBeUndefined();
    });
  });

  describe('createMedicationSchema', () => {
    it('有効なデータを受け入れる', () => {
      const result = createMedicationSchema.safeParse({ name: '薬A', category: '内服薬' });
      expect(result.success).toBe(true);
    });

    it('名前がない場合はエラー', () => {
      const result = createMedicationSchema.safeParse({ category: '内服薬' });
      expect(result.success).toBe(false);
    });

    it('stockQuantityが負の値の場合はエラー', () => {
      const result = createMedicationSchema.safeParse({ name: '薬A', stockQuantity: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe('updateStockSchema', () => {
    it('有効な在庫数を受け入れる', () => {
      const result = updateStockSchema.safeParse({ stockQuantity: 10 });
      expect(result.success).toBe(true);
    });

    it('負の値はエラー', () => {
      const result = updateStockSchema.safeParse({ stockQuantity: -1 });
      expect(result.success).toBe(false);
    });

    it('文字列はエラー', () => {
      const result = updateStockSchema.safeParse({ stockQuantity: 'abc' });
      expect(result.success).toBe(false);
    });
  });

  describe('createScheduleSchema', () => {
    it('有効なデータを受け入れる', () => {
      const result = createScheduleSchema.safeParse({
        medicationId: 'med-1',
        memberId: 'mem-1',
        scheduledTime: '08:00',
      });
      expect(result.success).toBe(true);
    });

    it('必須フィールドが不足している場合はエラー', () => {
      const result = createScheduleSchema.safeParse({ scheduledTime: '08:00' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateScheduleSchema', () => {
    it('部分的な更新を受け入れる', () => {
      const result = updateScheduleSchema.safeParse({ isEnabled: false });
      expect(result.success).toBe(true);
    });

    it('空オブジェクトでも受け入れる', () => {
      const result = updateScheduleSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('createRecordSchema', () => {
    it('有効なデータを受け入れる', () => {
      const result = createRecordSchema.safeParse({
        memberId: 'mem-1',
        medicationId: 'med-1',
      });
      expect(result.success).toBe(true);
    });

    it('必須フィールドが不足している場合はエラー', () => {
      const result = createRecordSchema.safeParse({ memberId: 'mem-1' });
      expect(result.success).toBe(false);
    });
  });

  describe('createHospitalSchema', () => {
    it('有効なデータを受け入れる', () => {
      const result = createHospitalSchema.safeParse({ name: 'A病院' });
      expect(result.success).toBe(true);
    });

    it('名前がない場合はエラー', () => {
      const result = createHospitalSchema.safeParse({ address: '東京都' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateHospitalSchema', () => {
    it('部分的な更新を受け入れる', () => {
      const result = updateHospitalSchema.safeParse({ name: 'B病院' });
      expect(result.success).toBe(true);
    });

    it('空オブジェクトはエラー', () => {
      const result = updateHospitalSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('createAppointmentSchema', () => {
    it('有効なデータを受け入れる', () => {
      const result = createAppointmentSchema.safeParse({
        memberId: 'mem-1',
        appointmentDate: '2026-03-01',
      });
      expect(result.success).toBe(true);
    });

    it('必須フィールドが不足している場合はエラー', () => {
      const result = createAppointmentSchema.safeParse({ memberId: 'mem-1' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateAppointmentSchema', () => {
    it('部分的な更新を受け入れる', () => {
      const result = updateAppointmentSchema.safeParse({ type: '再診' });
      expect(result.success).toBe(true);
    });

    it('空オブジェクトはエラー', () => {
      const result = updateAppointmentSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
