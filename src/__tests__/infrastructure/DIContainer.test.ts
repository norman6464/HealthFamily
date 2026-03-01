import { describe, it, expect, beforeEach } from 'vitest';
import { getDIContainer, setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';

beforeEach(() => {
  resetDIContainer();
});

describe('DIContainer', () => {
  describe('getDIContainer', () => {
    it('全てのリポジトリを含むコンテナを返す', () => {
      const container = getDIContainer();

      expect(container.memberRepository).toBeDefined();
      expect(container.medicationRepository).toBeDefined();
      expect(container.scheduleRepository).toBeDefined();
      expect(container.appointmentRepository).toBeDefined();
      expect(container.hospitalRepository).toBeDefined();
      expect(container.medicationRecordRepository).toBeDefined();
      expect(container.userProfileRepository).toBeDefined();
    });

    it('シングルトンとして同じインスタンスを返す', () => {
      const container1 = getDIContainer();
      const container2 = getDIContainer();

      expect(container1).toBe(container2);
    });
  });

  describe('setDIContainer', () => {
    it('コンテナを差し替えできる', () => {
      const mockContainer = {
        memberRepository: {} as DIContainer['memberRepository'],
        medicationRepository: {} as DIContainer['medicationRepository'],
        scheduleRepository: {} as DIContainer['scheduleRepository'],
        appointmentRepository: {} as DIContainer['appointmentRepository'],
        hospitalRepository: {} as DIContainer['hospitalRepository'],
        medicationRecordRepository: {} as DIContainer['medicationRecordRepository'],
        userProfileRepository: {} as DIContainer['userProfileRepository'],
      };

      setDIContainer(mockContainer);
      const container = getDIContainer();

      expect(container).toBe(mockContainer);
    });
  });

  describe('resetDIContainer', () => {
    it('リセット後に新しいインスタンスが作成される', () => {
      const container1 = getDIContainer();
      resetDIContainer();
      const container2 = getDIContainer();

      expect(container1).not.toBe(container2);
    });
  });
});
