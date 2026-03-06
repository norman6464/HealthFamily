import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Notification Priority Scoring', () => {
  describe('getNotificationPriority', () => {
    it('期限超過で最高優先度10を返す', () => {
      expect(ScheduleEntity.getNotificationPriority('overdue', 0)).toBe(10);
    });

    it('15分以内のpendingで優先度8を返す', () => {
      expect(ScheduleEntity.getNotificationPriority('pending', 10)).toBe(8);
    });

    it('30分以内のpendingで優先度6を返す', () => {
      expect(ScheduleEntity.getNotificationPriority('pending', 25)).toBe(6);
    });

    it('60分以内のpendingで優先度4を返す', () => {
      expect(ScheduleEntity.getNotificationPriority('pending', 45)).toBe(4);
    });

    it('60分超のpendingで優先度2を返す', () => {
      expect(ScheduleEntity.getNotificationPriority('pending', 120)).toBe(2);
    });

    it('completedで優先度0を返す', () => {
      expect(ScheduleEntity.getNotificationPriority('completed', 0)).toBe(0);
    });
  });

  describe('getNotificationPriorityLabel', () => {
    it('優先度10で「緊急」', () => {
      expect(ScheduleEntity.getNotificationPriorityLabel(10)).toBe('緊急');
    });

    it('優先度8で「高」', () => {
      expect(ScheduleEntity.getNotificationPriorityLabel(8)).toBe('高');
    });

    it('優先度5で「中」', () => {
      expect(ScheduleEntity.getNotificationPriorityLabel(5)).toBe('中');
    });

    it('優先度2で「低」', () => {
      expect(ScheduleEntity.getNotificationPriorityLabel(2)).toBe('低');
    });

    it('優先度0で「なし」', () => {
      expect(ScheduleEntity.getNotificationPriorityLabel(0)).toBe('なし');
    });
  });

  describe('sortByNotificationPriority', () => {
    it('優先度の高い順にソートする', () => {
      const items = [
        { status: 'completed' as const, minutesUntil: 0 },
        { status: 'overdue' as const, minutesUntil: 0 },
        { status: 'pending' as const, minutesUntil: 45 },
      ];
      const sorted = ScheduleEntity.sortByNotificationPriority(items);
      expect(sorted[0].status).toBe('overdue');
      expect(sorted[1].status).toBe('pending');
      expect(sorted[2].status).toBe('completed');
    });

    it('空配列は空配列を返す', () => {
      expect(ScheduleEntity.sortByNotificationPriority([])).toEqual([]);
    });
  });
});
