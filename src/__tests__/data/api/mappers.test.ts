import { describe, it, expect } from 'vitest';
import {
  toMember,
  toMedication,
  toMedicationRecord,
  toHospital,
  toAppointment,
  toSchedule,
} from '@/data/api/mappers';
import { BackendMember, BackendMedication, BackendRecord, BackendHospital, BackendAppointment, BackendSchedule } from '@/data/api/types';

describe('toMember', () => {
  const validBackend: BackendMember = {
    id: 'mem-1',
    userId: 'user-1',
    name: 'テスト太郎',
    memberType: 'human',
    petType: undefined,
    birthDate: '1990-05-15',
    notes: 'メモ',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  };

  it('完全なデータを正しく変換する', () => {
    const result = toMember(validBackend);
    expect(result.id).toBe('mem-1');
    expect(result.userId).toBe('user-1');
    expect(result.name).toBe('テスト太郎');
    expect(result.memberType).toBe('human');
    expect(result.birthDate).toBeInstanceOf(Date);
    expect(result.notes).toBe('メモ');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('birthDateがない場合undefinedを返す', () => {
    const result = toMember({ ...validBackend, birthDate: undefined });
    expect(result.birthDate).toBeUndefined();
  });

  it('memberTypeがない場合humanをデフォルトにする', () => {
    const result = toMember({ ...validBackend, memberType: undefined });
    expect(result.memberType).toBe('human');
  });

  it('ペットタイプを正しく変換する', () => {
    const result = toMember({ ...validBackend, memberType: 'pet', petType: 'dog' });
    expect(result.memberType).toBe('pet');
    expect(result.petType).toBe('dog');
  });
});

describe('toMedication', () => {
  const validBackend: BackendMedication = {
    id: 'med-1',
    memberId: 'mem-1',
    userId: 'user-1',
    name: 'テスト薬',
    category: 'regular',
    dosageAmount: '1錠',
    frequency: '1日3回',
    stockQuantity: 30,
    stockAlertDate: '2025-06-01',
    instructions: '食後に服用',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  };

  it('完全なデータを正しく変換する', () => {
    const result = toMedication(validBackend);
    expect(result.id).toBe('med-1');
    expect(result.name).toBe('テスト薬');
    expect(result.category).toBe('regular');
    expect(result.dosage).toBe('1錠');
    expect(result.frequency).toBe('1日3回');
    expect(result.stockQuantity).toBe(30);
    expect(result.stockAlertDate).toBeInstanceOf(Date);
    expect(result.instructions).toBe('食後に服用');
    expect(result.isActive).toBe(true);
  });

  it('categoryがない場合regularをデフォルトにする', () => {
    const result = toMedication({ ...validBackend, category: undefined });
    expect(result.category).toBe('regular');
  });

  it('isActiveがundefinedの場合trueをデフォルトにする', () => {
    const result = toMedication({ ...validBackend, isActive: undefined });
    expect(result.isActive).toBe(true);
  });

  it('stockAlertDateがない場合undefinedを返す', () => {
    const result = toMedication({ ...validBackend, stockAlertDate: undefined });
    expect(result.stockAlertDate).toBeUndefined();
  });

  it('オプショナルフィールドがすべてundefinedでも変換できる', () => {
    const result = toMedication({
      ...validBackend,
      dosageAmount: undefined,
      frequency: undefined,
      stockQuantity: undefined,
      instructions: undefined,
    });
    expect(result.dosage).toBeUndefined();
    expect(result.frequency).toBeUndefined();
    expect(result.stockQuantity).toBeUndefined();
    expect(result.instructions).toBeUndefined();
  });
});

describe('toMedicationRecord', () => {
  const validBackend: BackendRecord = {
    id: 'rec-1',
    userId: 'user-1',
    memberId: 'mem-1',
    memberName: 'テスト太郎',
    medicationId: 'med-1',
    medicationName: 'テスト薬',
    scheduleId: 'sched-1',
    takenAt: '2025-06-15T08:00:00Z',
    notes: '服用メモ',
    dosageAmount: '1錠',
  };

  it('完全なデータを正しく変換する', () => {
    const result = toMedicationRecord(validBackend);
    expect(result.id).toBe('rec-1');
    expect(result.memberName).toBe('テスト太郎');
    expect(result.medicationName).toBe('テスト薬');
    expect(result.takenAt).toBeInstanceOf(Date);
    expect(result.notes).toBe('服用メモ');
    expect(result.dosageAmount).toBe('1錠');
  });

  it('memberNameがundefinedの場合空文字を返す', () => {
    const result = toMedicationRecord({ ...validBackend, memberName: undefined });
    expect(result.memberName).toBe('');
  });

  it('medicationNameがundefinedの場合空文字を返す', () => {
    const result = toMedicationRecord({ ...validBackend, medicationName: undefined });
    expect(result.medicationName).toBe('');
  });

  it('オプショナルフィールドを正しく処理する', () => {
    const result = toMedicationRecord({
      ...validBackend,
      scheduleId: undefined,
      notes: undefined,
      dosageAmount: undefined,
    });
    expect(result.scheduleId).toBeUndefined();
    expect(result.notes).toBeUndefined();
    expect(result.dosageAmount).toBeUndefined();
  });
});

describe('toHospital', () => {
  const validBackend: BackendHospital = {
    id: 'hosp-1',
    userId: 'user-1',
    name: 'テスト病院',
    hospitalType: 'checkup',
    address: '東京都渋谷区',
    phoneNumber: '03-1234-5678',
    notes: '備考',
    createdAt: '2025-01-01T00:00:00Z',
  };

  it('完全なデータを正しく変換する', () => {
    const result = toHospital(validBackend);
    expect(result.id).toBe('hosp-1');
    expect(result.name).toBe('テスト病院');
    expect(result.hospitalType).toBe('checkup');
    expect(result.address).toBe('東京都渋谷区');
    expect(result.phoneNumber).toBe('03-1234-5678');
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('オプショナルフィールドがundefinedでも変換できる', () => {
    const result = toHospital({
      ...validBackend,
      hospitalType: undefined,
      address: undefined,
      phoneNumber: undefined,
      notes: undefined,
    });
    expect(result.hospitalType).toBeUndefined();
    expect(result.address).toBeUndefined();
    expect(result.phoneNumber).toBeUndefined();
    expect(result.notes).toBeUndefined();
  });
});

describe('toAppointment', () => {
  const validBackend: BackendAppointment = {
    id: 'apt-1',
    userId: 'user-1',
    memberId: 'mem-1',
    memberName: 'テスト太郎',
    hospitalId: 'hosp-1',
    hospitalName: 'テスト病院',
    appointmentType: 'checkup',
    appointmentDate: '2025-06-01T00:00:00Z',
    description: '定期検診',
    reminderEnabled: true,
    reminderDaysBefore: 3,
    createdAt: '2025-01-01T00:00:00Z',
  };

  it('完全なデータを正しく変換する', () => {
    const result = toAppointment(validBackend);
    expect(result.id).toBe('apt-1');
    expect(result.memberName).toBe('テスト太郎');
    expect(result.hospitalName).toBe('テスト病院');
    expect(result.appointmentType).toBe('checkup');
    expect(result.appointmentDate).toBeInstanceOf(Date);
    expect(result.reminderEnabled).toBe(true);
    expect(result.reminderDaysBefore).toBe(3);
  });

  it('reminderEnabledがundefinedの場合trueをデフォルトにする', () => {
    const result = toAppointment({ ...validBackend, reminderEnabled: undefined });
    expect(result.reminderEnabled).toBe(true);
  });

  it('reminderDaysBeforeがundefinedの場合1をデフォルトにする', () => {
    const result = toAppointment({ ...validBackend, reminderDaysBefore: undefined });
    expect(result.reminderDaysBefore).toBe(1);
  });

  it('オプショナルフィールドがundefinedでも変換できる', () => {
    const result = toAppointment({
      ...validBackend,
      memberName: undefined,
      hospitalId: undefined,
      hospitalName: undefined,
      appointmentType: undefined,
      description: undefined,
    });
    expect(result.memberName).toBeUndefined();
    expect(result.hospitalId).toBeUndefined();
    expect(result.hospitalName).toBeUndefined();
    expect(result.appointmentType).toBeUndefined();
    expect(result.description).toBeUndefined();
  });
});

describe('toSchedule', () => {
  const validBackend: BackendSchedule = {
    id: 'sched-1',
    medicationId: 'med-1',
    userId: 'user-1',
    memberId: 'mem-1',
    scheduledTime: '08:00',
    daysOfWeek: ['mon', 'wed', 'fri'],
    isEnabled: true,
    reminderMinutesBefore: 15,
    createdAt: '2025-01-01T00:00:00Z',
  };

  it('完全なデータを正しく変換する', () => {
    const result = toSchedule(validBackend);
    expect(result.id).toBe('sched-1');
    expect(result.medicationId).toBe('med-1');
    expect(result.scheduledTime).toBe('08:00');
    expect(result.daysOfWeek).toEqual(['mon', 'wed', 'fri']);
    expect(result.isEnabled).toBe(true);
    expect(result.reminderMinutesBefore).toBe(15);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('daysOfWeekがundefinedの場合空配列をデフォルトにする', () => {
    const result = toSchedule({ ...validBackend, daysOfWeek: undefined });
    expect(result.daysOfWeek).toEqual([]);
  });

  it('isEnabledがundefinedの場合trueをデフォルトにする', () => {
    const result = toSchedule({ ...validBackend, isEnabled: undefined });
    expect(result.isEnabled).toBe(true);
  });

  it('reminderMinutesBeforeがundefinedの場合10をデフォルトにする', () => {
    const result = toSchedule({ ...validBackend, reminderMinutesBefore: undefined });
    expect(result.reminderMinutesBefore).toBe(10);
  });
});
