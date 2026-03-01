import { describe, it, expect, vi } from 'vitest';
import { GetHospitals, CreateHospital, DeleteHospital } from '@/domain/usecases/ManageHospitals';
import { HospitalRepository } from '@/domain/repositories/HospitalRepository';
import { Hospital } from '@/domain/entities/Appointment';

const mockHospital: Hospital = {
  id: 'hosp-1',
  userId: 'user-1',
  name: 'テスト病院',
  hospitalType: 'checkup',
  createdAt: new Date(),
};

const createMockRepository = (): HospitalRepository => ({
  getHospitals: vi.fn().mockResolvedValue([mockHospital]),
  createHospital: vi.fn().mockResolvedValue(mockHospital),
  deleteHospital: vi.fn().mockResolvedValue(undefined),
});

describe('GetHospitals', () => {
  it('病院一覧を取得する', async () => {
    const repo = createMockRepository();
    const useCase = new GetHospitals(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(mockHospital);
    expect(repo.getHospitals).toHaveBeenCalled();
  });
});

describe('CreateHospital', () => {
  it('有効な入力で病院を作成する', async () => {
    const repo = createMockRepository();
    const useCase = new CreateHospital(repo);
    const result = await useCase.execute({ name: 'テスト病院' });

    expect(result).toBe(mockHospital);
    expect(repo.createHospital).toHaveBeenCalled();
  });

  it('空の病院名の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateHospital(repo);

    await expect(
      useCase.execute({ name: '' })
    ).rejects.toThrow('病院名は必須です');
  });

  it('空白のみの病院名の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateHospital(repo);

    await expect(
      useCase.execute({ name: '   ' })
    ).rejects.toThrow('病院名は必須です');
  });
});

describe('DeleteHospital', () => {
  it('病院を削除する', async () => {
    const repo = createMockRepository();
    const useCase = new DeleteHospital(repo);
    await useCase.execute('hosp-1');

    expect(repo.deleteHospital).toHaveBeenCalledWith('hosp-1');
  });
});
