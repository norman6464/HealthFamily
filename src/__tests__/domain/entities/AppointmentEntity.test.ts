import { describe, it, expect } from 'vitest';
import { AppointmentEntity, Appointment } from '@/domain/entities/Appointment';

const createAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'apt-1',
  userId: 'user-1',
  memberId: 'member-1',
  appointmentDate: new Date('2024-06-15'),
  reminderEnabled: true,
  reminderDaysBefore: 1,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

describe('AppointmentEntity', () => {
  describe('isToday', () => {
    it('今日の予約の場合 true を返す', () => {
      const entity = new AppointmentEntity(
        createAppointment({ appointmentDate: new Date() })
      );
      expect(entity.isToday()).toBe(true);
    });

    it('明日の予約の場合 false を返す', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const entity = new AppointmentEntity(
        createAppointment({ appointmentDate: tomorrow })
      );
      expect(entity.isToday()).toBe(false);
    });
  });

  describe('isPast', () => {
    it('過去の予約の場合 true を返す', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      const entity = new AppointmentEntity(
        createAppointment({ appointmentDate: pastDate })
      );
      expect(entity.isPast()).toBe(true);
    });

    it('今日の予約の場合 false を返す', () => {
      const entity = new AppointmentEntity(
        createAppointment({ appointmentDate: new Date() })
      );
      expect(entity.isPast()).toBe(false);
    });

    it('未来の予約の場合 false を返す', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const entity = new AppointmentEntity(
        createAppointment({ appointmentDate: futureDate })
      );
      expect(entity.isPast()).toBe(false);
    });
  });

  describe('daysUntil', () => {
    it('未来の予約の場合、正の日数を返す', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const entity = new AppointmentEntity(
        createAppointment({ appointmentDate: futureDate })
      );
      expect(entity.daysUntil()).toBe(5);
    });

    it('今日の予約の場合 0 を返す', () => {
      const entity = new AppointmentEntity(
        createAppointment({ appointmentDate: new Date() })
      );
      expect(entity.daysUntil()).toBe(0);
    });

    it('過去の予約の場合、負の日数を返す', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      const entity = new AppointmentEntity(
        createAppointment({ appointmentDate: pastDate })
      );
      expect(entity.daysUntil()).toBe(-3);
    });
  });

  describe('getFormattedDate', () => {
    it('日本語の日付フォーマットで返す', () => {
      const entity = new AppointmentEntity(
        createAppointment({ appointmentDate: new Date('2024-06-15T00:00:00') })
      );
      const result = entity.getFormattedDate();
      expect(result).toBe('2024年6月15日(土)');
    });
  });

  describe('getTypeLabel', () => {
    it('種別ラベルを日本語で返す', () => {
      const entity = new AppointmentEntity(
        createAppointment({ appointmentType: 'checkup' })
      );
      expect(entity.getTypeLabel()).toBe('定期検診');
    });

    it('未知の種別はそのまま返す', () => {
      const entity = new AppointmentEntity(
        createAppointment({ appointmentType: 'custom' })
      );
      expect(entity.getTypeLabel()).toBe('custom');
    });

    it('種別が未設定の場合は空文字を返す', () => {
      const entity = new AppointmentEntity(createAppointment());
      expect(entity.getTypeLabel()).toBe('');
    });

    it('全種別のラベルが正しい', () => {
      const cases: [string, string][] = [
        ['treatment', '治療'],
        ['vaccination', '予防接種'],
        ['surgery', '手術'],
        ['consultation', '相談'],
        ['other', 'その他'],
      ];
      for (const [type, label] of cases) {
        const entity = new AppointmentEntity(
          createAppointment({ appointmentType: type })
        );
        expect(entity.getTypeLabel()).toBe(label);
      }
    });
  });

  describe('id / data', () => {
    it('プロパティにアクセスできる', () => {
      const appointment = createAppointment({ id: 'apt-xyz' });
      const entity = new AppointmentEntity(appointment);
      expect(entity.id).toBe('apt-xyz');
      expect(entity.data).toBe(appointment);
    });
  });
});
