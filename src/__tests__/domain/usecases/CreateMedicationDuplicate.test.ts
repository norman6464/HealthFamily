import { describe, it, expect, vi } from 'vitest';
import { CreateMedicationWithSchedule, DuplicateMedicationError } from '../../../domain/usecases/ManageMedications';
import { MedicationRepository, CreateMedicationInput } from '../../../domain/repositories/MedicationRepository';
import { ScheduleRepository } from '../../../domain/repositories/ScheduleRepository';
import { Medication, MedicationCategory } from '../../../domain/entities/Medication';

function createMockMedicationRepo(existingMeds: Medication[] = []): MedicationRepository {
  return {
    getMedicationsByMember: vi.fn().mockResolvedValue(existingMeds),
    getMedicationById: vi.fn().mockResolvedValue(null),
    createMedication: vi.fn().mockImplementation(async (input: CreateMedicationInput) => ({
      id: 'new-id',
      ...input,
      isActive: true,
      createdAt: new Date(),
    })),
    updateMedication: vi.fn(),
    deleteMedication: vi.fn(),
    reorderMedications: vi.fn(),
    searchMedications: vi.fn().mockResolvedValue([]),
    getStockAlerts: vi.fn().mockResolvedValue([]),
  };
}

function createMockScheduleRepo(): ScheduleRepository {
  return {
    findById: vi.fn(),
    getSchedules: vi.fn(),
    getSchedulesRaw: vi.fn(),
    getTodaySchedules: vi.fn(),
    findOverlapping: vi.fn(),
    createSchedule: vi.fn().mockResolvedValue({
      id: 'sched-1',
      medicationId: 'new-id',
      userId: 'u1',
      memberId: 'm1',
      scheduledTime: '08:00',
      daysOfWeek: [],
      isEnabled: true,
      reminderMinutesBefore: 5,
      createdAt: new Date(),
    }),
    updateSchedule: vi.fn(),
    deleteSchedule: vi.fn(),
    markAsCompleted: vi.fn(),
  };
}

describe('CreateMedicationWithSchedule - 重複チェック', () => {
  const baseInput: CreateMedicationInput = {
    memberId: 'm1',
    userId: 'u1',
    name: 'クラリチン',
    category: 'internal' as MedicationCategory,
  };

  it('同一メンバー・同一薬名の重複がある場合はエラーを投げる', async () => {
    const existingMeds: Medication[] = [
      {
        id: 'existing-1',
        memberId: 'm1',
        userId: 'u1',
        name: 'クラリチン',
        category: 'internal' as MedicationCategory,
        isActive: true,
        createdAt: new Date(),
      },
    ];
    const medRepo = createMockMedicationRepo(existingMeds);
    const schedRepo = createMockScheduleRepo();
    const usecase = new CreateMedicationWithSchedule(medRepo, schedRepo);

    await expect(usecase.execute(baseInput)).rejects.toThrow('同じ名前のお薬が既に登録されています');
    expect(medRepo.createMedication).not.toHaveBeenCalled();
  });

  it('異なるメンバーの同一薬名は許可される', async () => {
    // 別メンバー(m2)に同名の薬が存在するが、m1には無い想定
    // getMedicationsByMember returns empty for m1
    const medRepo = createMockMedicationRepo([]);
    const schedRepo = createMockScheduleRepo();
    const usecase = new CreateMedicationWithSchedule(medRepo, schedRepo);

    const result = await usecase.execute(baseInput);
    expect(result).toBeDefined();
    expect(medRepo.createMedication).toHaveBeenCalled();
  });

  it('重複チェックは大文字小文字を区別しない', async () => {
    const existingMeds: Medication[] = [
      {
        id: 'existing-1',
        memberId: 'm1',
        userId: 'u1',
        name: 'Claritin',
        category: 'internal' as MedicationCategory,
        isActive: true,
        createdAt: new Date(),
      },
    ];
    const medRepo = createMockMedicationRepo(existingMeds);
    const schedRepo = createMockScheduleRepo();
    const usecase = new CreateMedicationWithSchedule(medRepo, schedRepo);

    await expect(usecase.execute({ ...baseInput, name: 'claritin' })).rejects.toThrow(DuplicateMedicationError);
  });

  it('非アクティブな薬は重複として扱わない', async () => {
    const existingMeds: Medication[] = [
      {
        id: 'existing-1',
        memberId: 'm1',
        userId: 'u1',
        name: 'クラリチン',
        category: 'internal' as MedicationCategory,
        isActive: false,
        createdAt: new Date(),
      },
    ];
    const medRepo = createMockMedicationRepo(existingMeds);
    const schedRepo = createMockScheduleRepo();
    const usecase = new CreateMedicationWithSchedule(medRepo, schedRepo);

    const result = await usecase.execute(baseInput);
    expect(result).toBeDefined();
    expect(medRepo.createMedication).toHaveBeenCalled();
  });

  it('重複がない場合は正常に作成される', async () => {
    const medRepo = createMockMedicationRepo([]);
    const schedRepo = createMockScheduleRepo();
    const usecase = new CreateMedicationWithSchedule(medRepo, schedRepo);

    const result = await usecase.execute(baseInput);
    expect(result).toBeDefined();
    expect(medRepo.createMedication).toHaveBeenCalledTimes(1);
  });
});
