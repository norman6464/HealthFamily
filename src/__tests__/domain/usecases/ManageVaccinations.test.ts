import { describe, it, expect, vi } from 'vitest';
import {
  GetVaccinations,
  CreateVaccination,
  UpdateVaccination,
  DeleteVaccination,
} from '@/domain/usecases/ManageVaccinations';
import { VaccinationRepository } from '@/domain/repositories/VaccinationRepository';
import { Vaccination } from '@/domain/entities/Vaccination';

const mockVaccination: Vaccination = {
  id: 'vac-1',
  userId: 'user-1',
  memberId: 'mem-1',
  memberName: 'テスト太郎',
  vaccineName: 'インフルエンザ',
  vaccinatedAt: new Date('2025-11-01'),
  nextScheduledDate: new Date('2026-11-01'),
  notes: 'メモ',
  createdAt: new Date(),
};

const createMockRepository = (): VaccinationRepository => ({
  getAll: vi.fn().mockResolvedValue([mockVaccination]),
  create: vi.fn().mockResolvedValue(mockVaccination),
  update: vi.fn().mockResolvedValue({ ...mockVaccination, vaccineName: '更新ワクチン' }),
  delete: vi.fn().mockResolvedValue(undefined),
});

describe('GetVaccinations', () => {
  it('ワクチン一覧を取得する', async () => {
    const repo = createMockRepository();
    const useCase = new GetVaccinations(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].vaccineName).toBe('インフルエンザ');
    expect(repo.getAll).toHaveBeenCalled();
  });

  it('空の配列を返す場合もエラーにならない', async () => {
    const repo = createMockRepository();
    (repo.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const useCase = new GetVaccinations(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(0);
  });

  it('リポジトリがエラーを投げた場合そのまま伝搬する', async () => {
    const repo = createMockRepository();
    (repo.getAll as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB接続エラー'));
    const useCase = new GetVaccinations(repo);

    await expect(useCase.execute()).rejects.toThrow('DB接続エラー');
  });
});

describe('CreateVaccination', () => {
  it('有効な入力でワクチンを作成する', async () => {
    const repo = createMockRepository();
    const useCase = new CreateVaccination(repo);
    const result = await useCase.execute({
      memberId: 'mem-1',
      vaccineName: 'インフルエンザ',
      vaccinatedAt: '2025-11-01',
    });

    expect(result.vaccineName).toBe('インフルエンザ');
    expect(repo.create).toHaveBeenCalledWith({
      memberId: 'mem-1',
      vaccineName: 'インフルエンザ',
      vaccinatedAt: '2025-11-01',
    });
  });

  it('次回予定日付きでワクチンを作成する', async () => {
    const repo = createMockRepository();
    const useCase = new CreateVaccination(repo);
    await useCase.execute({
      memberId: 'mem-1',
      vaccineName: 'インフルエンザ',
      vaccinatedAt: '2025-11-01',
      nextScheduledDate: '2026-11-01',
      notes: '来年も接種予定',
    });

    expect(repo.create).toHaveBeenCalledWith({
      memberId: 'mem-1',
      vaccineName: 'インフルエンザ',
      vaccinatedAt: '2025-11-01',
      nextScheduledDate: '2026-11-01',
      notes: '来年も接種予定',
    });
  });

  it('メンバーIDが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateVaccination(repo);

    await expect(
      useCase.execute({
        memberId: '',
        vaccineName: 'インフルエンザ',
        vaccinatedAt: '2025-11-01',
      })
    ).rejects.toThrow('メンバーIDは必須です');
  });

  it('ワクチン名が空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateVaccination(repo);

    await expect(
      useCase.execute({
        memberId: 'mem-1',
        vaccineName: '',
        vaccinatedAt: '2025-11-01',
      })
    ).rejects.toThrow('ワクチンの種類は必須です');
  });

  it('接種日が空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateVaccination(repo);

    await expect(
      useCase.execute({
        memberId: 'mem-1',
        vaccineName: 'インフルエンザ',
        vaccinatedAt: '',
      })
    ).rejects.toThrow('接種日は必須です');
  });
});

describe('UpdateVaccination', () => {
  it('ワクチン情報を更新する', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateVaccination(repo);
    const result = await useCase.execute('vac-1', { vaccineName: '更新ワクチン' });

    expect(result.vaccineName).toBe('更新ワクチン');
    expect(repo.update).toHaveBeenCalledWith('vac-1', { vaccineName: '更新ワクチン' });
  });

  it('IDが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateVaccination(repo);

    await expect(
      useCase.execute('', { vaccineName: '更新' })
    ).rejects.toThrow('ワクチンIDは必須です');
  });

  it('次回予定日をnullで更新できる', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateVaccination(repo);
    await useCase.execute('vac-1', { nextScheduledDate: null });

    expect(repo.update).toHaveBeenCalledWith('vac-1', { nextScheduledDate: null });
  });
});

describe('DeleteVaccination', () => {
  it('ワクチンを削除する', async () => {
    const repo = createMockRepository();
    const useCase = new DeleteVaccination(repo);
    await useCase.execute('vac-1');

    expect(repo.delete).toHaveBeenCalledWith('vac-1');
  });

  it('リポジトリエラーが伝搬する', async () => {
    const repo = createMockRepository();
    (repo.delete as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('削除エラー'));
    const useCase = new DeleteVaccination(repo);

    await expect(useCase.execute('vac-1')).rejects.toThrow('削除エラー');
  });
});
