import { describe, it, expect } from 'vitest';
import {
  toMember,
  toMedication,
  toMedicationRecord,
  toHospital,
  toAppointment,
  toSchedule,
  toVaccination,
  toExamination,
  toAllergy,
  toInsurance,
  toHealthLog,
  toPrescription,
  toEmergencyContact,
  toBodyMeasurement,
} from '@/data/api/mappers';
import { BackendMember, BackendMedication, BackendRecord, BackendHospital, BackendAppointment, BackendSchedule, BackendVaccination, BackendExamination, BackendAllergy, BackendInsurance, BackendHealthLog, BackendPrescription, BackendEmergencyContact, BackendBodyMeasurement } from '@/data/api/types';

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

  it('intervalDaysとstartDateを正しく変換する', () => {
    const result = toSchedule({ ...validBackend, intervalDays: 21, startDate: '2026-03-01' });
    expect(result.intervalDays).toBe(21);
    expect(result.startDate).toBeInstanceOf(Date);
  });

  it('intervalDaysがundefinedの場合undefinedを返す', () => {
    const result = toSchedule({ ...validBackend, intervalDays: undefined, startDate: undefined });
    expect(result.intervalDays).toBeUndefined();
    expect(result.startDate).toBeUndefined();
  });

  it('不正な曜日をフィルタリングする', () => {
    const result = toSchedule({ ...validBackend, daysOfWeek: ['mon', 'invalid', 'fri'] });
    expect(result.daysOfWeek).toEqual(['mon', 'fri']);
  });
});

describe('toVaccination', () => {
  const validBackend: BackendVaccination = {
    id: 'vac-1',
    userId: 'user-1',
    memberId: 'mem-1',
    memberName: 'テスト太郎',
    vaccineName: 'インフルエンザ',
    vaccinatedAt: '2025-11-01',
    nextScheduledDate: '2026-11-01',
    notes: 'メモ',
    createdAt: '2025-01-01T00:00:00Z',
  };

  it('完全なデータを正しく変換する', () => {
    const result = toVaccination(validBackend);
    expect(result.id).toBe('vac-1');
    expect(result.vaccineName).toBe('インフルエンザ');
    expect(result.vaccinatedAt).toBeInstanceOf(Date);
    expect(result.nextScheduledDate).toBeInstanceOf(Date);
    expect(result.memberName).toBe('テスト太郎');
  });

  it('nextScheduledDateがundefinedの場合undefinedを返す', () => {
    const result = toVaccination({ ...validBackend, nextScheduledDate: undefined });
    expect(result.nextScheduledDate).toBeUndefined();
  });
});

describe('toExamination', () => {
  const validBackend: BackendExamination = {
    id: 'exam-1',
    userId: 'user-1',
    memberId: 'mem-1',
    memberName: '太郎',
    examinationType: '血液検査',
    examinedAt: '2025-12-01',
    nextScheduledDate: '2026-06-01',
    createdAt: '2025-01-01T00:00:00Z',
  };

  it('完全なデータを正しく変換する', () => {
    const result = toExamination(validBackend);
    expect(result.examinationType).toBe('血液検査');
    expect(result.examinedAt).toBeInstanceOf(Date);
    expect(result.nextScheduledDate).toBeInstanceOf(Date);
  });

  it('nextScheduledDateがundefinedの場合undefinedを返す', () => {
    const result = toExamination({ ...validBackend, nextScheduledDate: undefined });
    expect(result.nextScheduledDate).toBeUndefined();
  });
});

describe('toAllergy', () => {
  const validBackend: BackendAllergy = {
    id: 'alg-1',
    userId: 'user-1',
    memberId: 'mem-1',
    allergenName: 'ピーナッツ',
    allergyType: 'food',
    severity: 'severe',
    diagnosedAt: '2020-06-01',
    createdAt: '2025-01-01T00:00:00Z',
  };

  it('完全なデータを正しく変換する', () => {
    const result = toAllergy(validBackend);
    expect(result.allergenName).toBe('ピーナッツ');
    expect(result.allergyType).toBe('food');
    expect(result.severity).toBe('severe');
    expect(result.diagnosedAt).toBeInstanceOf(Date);
  });

  it('diagnosedAtがundefinedの場合undefinedを返す', () => {
    const result = toAllergy({ ...validBackend, diagnosedAt: undefined });
    expect(result.diagnosedAt).toBeUndefined();
  });
});

describe('toInsurance', () => {
  const validBackend: BackendInsurance = {
    id: 'ins-1',
    userId: 'user-1',
    memberId: 'mem-1',
    insuranceType: '健康保険',
    providerName: '全国健康保険協会',
    policyNumber: '12345',
    createdAt: '2025-01-01T00:00:00Z',
  };

  it('完全なデータを正しく変換する', () => {
    const result = toInsurance(validBackend);
    expect(result.insuranceType).toBe('健康保険');
    expect(result.providerName).toBe('全国健康保険協会');
    expect(result.policyNumber).toBe('12345');
  });
});

describe('toHealthLog', () => {
  const validBackend: BackendHealthLog = {
    id: 'log-1',
    userId: 'user-1',
    memberId: 'mem-1',
    memberName: '太郎',
    conditionLevel: 4,
    symptoms: ['headache', 'fever'],
    recordedAt: '2025-12-01T08:00:00Z',
  };

  it('完全なデータを正しく変換する', () => {
    const result = toHealthLog(validBackend);
    expect(result.conditionLevel).toBe(4);
    expect(result.symptoms).toEqual(['headache', 'fever']);
    expect(result.recordedAt).toBeInstanceOf(Date);
    expect(result.memberName).toBe('太郎');
  });

  it('不正なconditionLevelは3にフォールバックする', () => {
    const result = toHealthLog({ ...validBackend, conditionLevel: 10 });
    expect(result.conditionLevel).toBe(3);
  });

  it('conditionLevel=0は3にフォールバックする', () => {
    const result = toHealthLog({ ...validBackend, conditionLevel: 0 });
    expect(result.conditionLevel).toBe(3);
  });

  it('不正な症状をフィルタリングする', () => {
    const result = toHealthLog({ ...validBackend, symptoms: ['headache', 'invalid', 'fever'] });
    expect(result.symptoms).toEqual(['headache', 'fever']);
  });

  it('memberNameがundefinedの場合空文字にフォールバックする', () => {
    const result = toHealthLog({ ...validBackend, memberName: undefined });
    expect(result.memberName).toBe('');
  });
});

describe('toPrescription', () => {
  const validBackend: BackendPrescription = {
    id: 'pre-1',
    userId: 'user-1',
    memberId: 'mem-1',
    prescriptionName: 'テスト処方',
    prescribedAt: '2025-12-01',
    expiresAt: '2026-06-01',
    createdAt: '2025-01-01T00:00:00Z',
  };

  it('完全なデータを正しく変換する', () => {
    const result = toPrescription(validBackend);
    expect(result.prescriptionName).toBe('テスト処方');
    expect(result.prescribedAt).toBeInstanceOf(Date);
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('expiresAtがundefinedの場合undefinedを返す', () => {
    const result = toPrescription({ ...validBackend, expiresAt: undefined });
    expect(result.expiresAt).toBeUndefined();
  });
});

describe('toEmergencyContact', () => {
  it('完全なデータを正しく変換する', () => {
    const result = toEmergencyContact({
      id: 'ec-1',
      userId: 'user-1',
      memberId: 'mem-1',
      contactName: '田中花子',
      phoneNumber: '090-1234-5678',
      relationship: '母',
      createdAt: '2025-01-01T00:00:00Z',
    });
    expect(result.contactName).toBe('田中花子');
    expect(result.phoneNumber).toBe('090-1234-5678');
    expect(result.relationship).toBe('母');
  });
});

describe('toBodyMeasurement', () => {
  it('完全なデータを正しく変換する', () => {
    const result = toBodyMeasurement({
      id: 'bm-1',
      userId: 'user-1',
      memberId: 'mem-1',
      weight: 65.5,
      height: 170.2,
      recordedAt: '2025-12-01',
      createdAt: '2025-01-01T00:00:00Z',
    });
    expect(result.weight).toBe(65.5);
    expect(result.height).toBe(170.2);
    expect(result.recordedAt).toBeInstanceOf(Date);
  });
});
