import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Conflict Detection Edge Cases', () => {
  describe('hasConflict 境界値', () => {
    it('年跨ぎの同日は重複', () => {
      const d1 = new Date('2025-12-31T10:00:00');
      const d2 = new Date('2025-12-31T23:59:00');
      expect(AppointmentEntity.hasConflict(d1, d2)).toBe(true);
    });

    it('年跨ぎの前日と翌日は非重複', () => {
      const d1 = new Date('2025-12-31T23:59:00');
      const d2 = new Date('2026-01-01T00:01:00');
      expect(AppointmentEntity.hasConflict(d1, d2)).toBe(false);
    });

    it('月末と翌月初は非重複', () => {
      const d1 = new Date('2025-06-30T23:00:00');
      const d2 = new Date('2025-07-01T01:00:00');
      expect(AppointmentEntity.hasConflict(d1, d2)).toBe(false);
    });

    it('同じDateオブジェクトは重複', () => {
      const d = new Date('2025-06-15T10:00:00');
      expect(AppointmentEntity.hasConflict(d, d)).toBe(true);
    });
  });

  describe('findConflicts 境界値', () => {
    it('全て同日の場合全件返す', () => {
      const appointments = Array.from({ length: 5 }, (_, i) => ({
        appointmentDate: new Date(`2025-06-15T${10 + i}:00:00`),
        hospitalName: `病院${i}`,
      }));
      const conflicts = AppointmentEntity.findConflicts(appointments, new Date('2025-06-15'));
      expect(conflicts).toHaveLength(5);
    });
  });

  describe('getConflictMessage 境界値', () => {
    it('大きな数でも正しいメッセージ', () => {
      expect(AppointmentEntity.getConflictMessage(99)).toBe('同日に99件の予約があります');
    });
  });
});
