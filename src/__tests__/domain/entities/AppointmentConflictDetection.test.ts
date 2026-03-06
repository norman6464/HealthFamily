import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Conflict Detection', () => {
  describe('hasConflict', () => {
    it('同日の予約は重複と判定する', () => {
      const date1 = new Date('2025-06-15T10:00:00');
      const date2 = new Date('2025-06-15T14:00:00');
      expect(AppointmentEntity.hasConflict(date1, date2)).toBe(true);
    });

    it('異日の予約は重複しない', () => {
      const date1 = new Date('2025-06-15T10:00:00');
      const date2 = new Date('2025-06-16T10:00:00');
      expect(AppointmentEntity.hasConflict(date1, date2)).toBe(false);
    });

    it('同日の深夜と朝でも重複', () => {
      const date1 = new Date('2025-06-15T01:00:00');
      const date2 = new Date('2025-06-15T23:59:00');
      expect(AppointmentEntity.hasConflict(date1, date2)).toBe(true);
    });
  });

  describe('findConflicts', () => {
    const appointments = [
      { appointmentDate: new Date('2025-06-15T10:00:00'), hospitalName: '東京病院' },
      { appointmentDate: new Date('2025-06-16T10:00:00'), hospitalName: '大阪クリニック' },
      { appointmentDate: new Date('2025-06-15T14:00:00'), hospitalName: '名古屋医院' },
    ];

    it('指定日と重複する予約を検出する', () => {
      const conflicts = AppointmentEntity.findConflicts(
        appointments,
        new Date('2025-06-15T09:00:00'),
      );
      expect(conflicts).toHaveLength(2);
    });

    it('重複がない場合は空配列を返す', () => {
      const conflicts = AppointmentEntity.findConflicts(
        appointments,
        new Date('2025-06-17T09:00:00'),
      );
      expect(conflicts).toHaveLength(0);
    });

    it('空配列に対しては空配列を返す', () => {
      const conflicts = AppointmentEntity.findConflicts(
        [],
        new Date('2025-06-15T09:00:00'),
      );
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('getConflictMessage', () => {
    it('0件の場合はnullを返す', () => {
      expect(AppointmentEntity.getConflictMessage(0)).toBeNull();
    });

    it('1件の場合は単数メッセージを返す', () => {
      expect(AppointmentEntity.getConflictMessage(1)).toBe('同日に1件の予約があります');
    });

    it('複数件の場合は複数メッセージを返す', () => {
      expect(AppointmentEntity.getConflictMessage(3)).toBe('同日に3件の予約があります');
    });
  });
});
