import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Notification Priority Edge Cases', () => {
  describe('getNotificationPriority', () => {
    it('境界値15分でpendingは優先度8', () => {
      expect(ScheduleEntity.getNotificationPriority('pending', 15)).toBe(8);
    });

    it('境界値16分でpendingは優先度6', () => {
      expect(ScheduleEntity.getNotificationPriority('pending', 16)).toBe(6);
    });

    it('境界値30分でpendingは優先度6', () => {
      expect(ScheduleEntity.getNotificationPriority('pending', 30)).toBe(6);
    });

    it('境界値31分でpendingは優先度4', () => {
      expect(ScheduleEntity.getNotificationPriority('pending', 31)).toBe(4);
    });

    it('境界値60分でpendingは優先度4', () => {
      expect(ScheduleEntity.getNotificationPriority('pending', 60)).toBe(4);
    });

    it('境界値61分でpendingは優先度2', () => {
      expect(ScheduleEntity.getNotificationPriority('pending', 61)).toBe(2);
    });

    it('overdueは残り時間に関係なく10', () => {
      expect(ScheduleEntity.getNotificationPriority('overdue', 999)).toBe(10);
    });
  });

  describe('getNotificationPriorityLabel', () => {
    it('境界値7で「高」', () => {
      expect(ScheduleEntity.getNotificationPriorityLabel(7)).toBe('高');
    });

    it('境界値6で「中」', () => {
      expect(ScheduleEntity.getNotificationPriorityLabel(6)).toBe('中');
    });

    it('境界値4で「中」', () => {
      expect(ScheduleEntity.getNotificationPriorityLabel(4)).toBe('中');
    });

    it('境界値3で「低」', () => {
      expect(ScheduleEntity.getNotificationPriorityLabel(3)).toBe('低');
    });

    it('境界値1で「低」', () => {
      expect(ScheduleEntity.getNotificationPriorityLabel(1)).toBe('低');
    });
  });
});
