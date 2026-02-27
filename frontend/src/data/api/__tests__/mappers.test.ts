import { describe, it, expect } from 'vitest';
import { toMember, toMedication, toSchedule } from '../mappers';
import { BackendMember, BackendMedication, BackendSchedule } from '../types';

describe('mappers', () => {
  describe('toMember', () => {
    it('BackendMemberをMemberに変換できる', () => {
      const backend: BackendMember = {
        memberId: 'mem-1',
        userId: 'user-1',
        name: 'パパ',
        memberType: 'human',
        birthDate: '1985-06-15T00:00:00.000Z',
        notes: '高血圧',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const result = toMember(backend);

      expect(result.id).toBe('mem-1');
      expect(result.userId).toBe('user-1');
      expect(result.name).toBe('パパ');
      expect(result.memberType).toBe('human');
      expect(result.birthDate).toBeInstanceOf(Date);
      expect(result.notes).toBe('高血圧');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('memberTypeが未設定の場合humanがデフォルトになる', () => {
      const backend: BackendMember = {
        memberId: 'mem-2',
        userId: 'user-1',
        name: 'ポチ',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = toMember(backend);
      expect(result.memberType).toBe('human');
    });

    it('birthDateが未設定の場合undefinedになる', () => {
      const backend: BackendMember = {
        memberId: 'mem-3',
        userId: 'user-1',
        name: 'テスト',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = toMember(backend);
      expect(result.birthDate).toBeUndefined();
    });

    it('petTypeが正しく変換される', () => {
      const backend: BackendMember = {
        memberId: 'mem-4',
        userId: 'user-1',
        name: 'ポチ',
        memberType: 'pet',
        petType: 'dog',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = toMember(backend);
      expect(result.memberType).toBe('pet');
      expect(result.petType).toBe('dog');
    });
  });

  describe('toMedication', () => {
    it('BackendMedicationをMedicationに変換できる', () => {
      const backend: BackendMedication = {
        medicationId: 'med-1',
        memberId: 'mem-1',
        userId: 'user-1',
        name: '血圧の薬',
        category: 'regular',
        dosageAmount: '1錠',
        frequency: '1日1回',
        stockQuantity: 28,
        lowStockThreshold: 7,
        instructions: '食後に服用',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const result = toMedication(backend);

      expect(result.id).toBe('med-1');
      expect(result.memberId).toBe('mem-1');
      expect(result.userId).toBe('user-1');
      expect(result.name).toBe('血圧の薬');
      expect(result.category).toBe('regular');
      expect(result.dosage).toBe('1錠');
      expect(result.frequency).toBe('1日1回');
      expect(result.stockQuantity).toBe(28);
      expect(result.lowStockThreshold).toBe(7);
      expect(result.instructions).toBe('食後に服用');
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('isActiveが未設定の場合trueがデフォルトになる', () => {
      const backend: BackendMedication = {
        medicationId: 'med-2',
        memberId: 'mem-1',
        userId: 'user-1',
        name: '薬',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = toMedication(backend);
      expect(result.isActive).toBe(true);
    });

    it('categoryが未設定の場合regularがデフォルトになる', () => {
      const backend: BackendMedication = {
        medicationId: 'med-3',
        memberId: 'mem-1',
        userId: 'user-1',
        name: '薬',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = toMedication(backend);
      expect(result.category).toBe('regular');
    });
  });

  describe('toSchedule', () => {
    it('BackendScheduleをScheduleに変換できる', () => {
      const backend: BackendSchedule = {
        scheduleId: 'sch-1',
        medicationId: 'med-1',
        userId: 'user-1',
        memberId: 'mem-1',
        scheduledTime: '08:00',
        daysOfWeek: ['mon', 'tue', 'wed'],
        isEnabled: true,
        reminderMinutesBefore: 15,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = toSchedule(backend);

      expect(result.id).toBe('sch-1');
      expect(result.medicationId).toBe('med-1');
      expect(result.userId).toBe('user-1');
      expect(result.memberId).toBe('mem-1');
      expect(result.scheduledTime).toBe('08:00');
      expect(result.daysOfWeek).toEqual(['mon', 'tue', 'wed']);
      expect(result.isEnabled).toBe(true);
      expect(result.reminderMinutesBefore).toBe(15);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('daysOfWeekが未設定の場合空配列がデフォルトになる', () => {
      const backend: BackendSchedule = {
        scheduleId: 'sch-2',
        medicationId: 'med-1',
        userId: 'user-1',
        memberId: 'mem-1',
        scheduledTime: '09:00',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = toSchedule(backend);
      expect(result.daysOfWeek).toEqual([]);
    });

    it('isEnabledが未設定の場合trueがデフォルトになる', () => {
      const backend: BackendSchedule = {
        scheduleId: 'sch-3',
        medicationId: 'med-1',
        userId: 'user-1',
        memberId: 'mem-1',
        scheduledTime: '10:00',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = toSchedule(backend);
      expect(result.isEnabled).toBe(true);
      expect(result.reminderMinutesBefore).toBe(10);
    });
  });
});
