import { describe, it, expect, beforeEach } from 'vitest';
import { getDIContainer, setDIContainer, resetDIContainer, DIContainer } from '../DIContainer';
import { MemberRepository } from '../../domain/repositories/MemberRepository';
import { MedicationRepository } from '../../domain/repositories/MedicationRepository';
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';

describe('DIContainer', () => {
  beforeEach(() => {
    resetDIContainer();
  });

  it('デフォルトのコンテナが正しく生成される', () => {
    const container = getDIContainer();

    expect(container.memberRepository).toBeDefined();
    expect(container.medicationRepository).toBeDefined();
    expect(container.scheduleRepository).toBeDefined();
  });

  it('シングルトンとして同一インスタンスを返す', () => {
    const container1 = getDIContainer();
    const container2 = getDIContainer();

    expect(container1).toBe(container2);
  });

  it('setDIContainerでコンテナを差し替えできる', () => {
    const mockContainer: DIContainer = {
      memberRepository: {} as MemberRepository,
      medicationRepository: {} as MedicationRepository,
      scheduleRepository: {} as ScheduleRepository,
    };

    setDIContainer(mockContainer);
    const container = getDIContainer();

    expect(container).toBe(mockContainer);
  });

  it('resetDIContainerでコンテナがリセットされる', () => {
    const container1 = getDIContainer();
    resetDIContainer();
    const container2 = getDIContainer();

    expect(container1).not.toBe(container2);
  });
});
