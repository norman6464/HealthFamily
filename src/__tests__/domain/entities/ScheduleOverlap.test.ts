import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('getScheduleOverlap', () => {
  it('空配列の場合0を返す', () => {
    expect(ScheduleEntity.getScheduleOverlap([])).toBe(0);
  });

  it('1つの時間帯の場合0を返す', () => {
    expect(ScheduleEntity.getScheduleOverlap([{ start: 480, end: 540 }])).toBe(0);
  });

  it('重複なしの場合0を返す', () => {
    const ranges = [
      { start: 480, end: 540 },
      { start: 600, end: 660 },
    ];
    expect(ScheduleEntity.getScheduleOverlap(ranges)).toBe(0);
  });

  it('完全に重複する場合100を返す', () => {
    const ranges = [
      { start: 480, end: 540 },
      { start: 480, end: 540 },
    ];
    expect(ScheduleEntity.getScheduleOverlap(ranges)).toBe(100);
  });

  it('2つの時間帯が部分的に重複する場合100を返す', () => {
    const ranges = [
      { start: 480, end: 540 },
      { start: 510, end: 570 },
    ];
    expect(ScheduleEntity.getScheduleOverlap(ranges)).toBe(100);
  });

  it('3つ中1ペアのみ重複の場合33を返す', () => {
    const ranges = [
      { start: 480, end: 540 },
      { start: 510, end: 570 },
      { start: 700, end: 760 },
    ];
    expect(ScheduleEntity.getScheduleOverlap(ranges)).toBe(33);
  });
});

describe('getScheduleOverlapLabel', () => {
  it('0は重複なしを返す', () => {
    expect(ScheduleEntity.getScheduleOverlapLabel(0)).toBe('重複なし');
  });

  it('30未満は軽微を返す', () => {
    expect(ScheduleEntity.getScheduleOverlapLabel(20)).toBe('軽微');
  });

  it('30以上60未満は注意を返す', () => {
    expect(ScheduleEntity.getScheduleOverlapLabel(45)).toBe('注意');
  });

  it('60以上は要調整を返す', () => {
    expect(ScheduleEntity.getScheduleOverlapLabel(80)).toBe('要調整');
  });

  it('100は要調整を返す', () => {
    expect(ScheduleEntity.getScheduleOverlapLabel(100)).toBe('要調整');
  });
});
