import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleOverlap エッジケーステスト', () => {
  describe('getScheduleOverlap', () => {
    it('空配列の場合0を返す', () => {
      expect(ScheduleEntity.getScheduleOverlap([])).toBe(0);
    });

    it('1要素の場合0を返す', () => {
      expect(ScheduleEntity.getScheduleOverlap([{ start: 0, end: 100 }])).toBe(0);
    });

    it('隣接するが重複しない場合0を返す', () => {
      const ranges = [
        { start: 480, end: 540 },
        { start: 540, end: 600 },
      ];
      expect(ScheduleEntity.getScheduleOverlap(ranges)).toBe(0);
    });

    it('1分だけ重複する場合100を返す', () => {
      const ranges = [
        { start: 480, end: 541 },
        { start: 540, end: 600 },
      ];
      expect(ScheduleEntity.getScheduleOverlap(ranges)).toBe(100);
    });

    it('全ペア重複の場合100を返す', () => {
      const ranges = [
        { start: 0, end: 1440 },
        { start: 0, end: 1440 },
        { start: 0, end: 1440 },
      ];
      expect(ScheduleEntity.getScheduleOverlap(ranges)).toBe(100);
    });

    it('start=endの場合重複しない', () => {
      const ranges = [
        { start: 480, end: 480 },
        { start: 480, end: 480 },
      ];
      expect(ScheduleEntity.getScheduleOverlap(ranges)).toBe(0);
    });

    it('4つの時間帯で2ペア重複の場合33を返す', () => {
      const ranges = [
        { start: 480, end: 540 },
        { start: 510, end: 570 },
        { start: 700, end: 760 },
        { start: 730, end: 790 },
      ];
      expect(ScheduleEntity.getScheduleOverlap(ranges)).toBe(33);
    });
  });

  describe('getScheduleOverlapLabel', () => {
    it('0は重複なしを返す', () => {
      expect(ScheduleEntity.getScheduleOverlapLabel(0)).toBe('重複なし');
    });

    it('境界値: 1は軽微を返す', () => {
      expect(ScheduleEntity.getScheduleOverlapLabel(1)).toBe('軽微');
    });

    it('境界値: 29は軽微を返す', () => {
      expect(ScheduleEntity.getScheduleOverlapLabel(29)).toBe('軽微');
    });

    it('境界値: 30は注意を返す', () => {
      expect(ScheduleEntity.getScheduleOverlapLabel(30)).toBe('注意');
    });

    it('境界値: 59は注意を返す', () => {
      expect(ScheduleEntity.getScheduleOverlapLabel(59)).toBe('注意');
    });

    it('境界値: 60は要調整を返す', () => {
      expect(ScheduleEntity.getScheduleOverlapLabel(60)).toBe('要調整');
    });
  });
});
