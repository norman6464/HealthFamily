import { describe, it, expect, vi } from 'vitest';
import {
  GetInsurances,
  CreateInsurance,
  UpdateInsurance,
  DeleteInsurance,
} from '@/domain/usecases/ManageInsurances';
import { InsuranceRepository } from '@/domain/repositories/InsuranceRepository';
import { Insurance } from '@/domain/entities/Insurance';

const mockInsurance: Insurance = {
  id: 'ins-1',
  userId: 'user-1',
  memberId: 'mem-1',
  memberName: 'テスト太郎',
  insuranceType: '健康保険',
  providerName: '全国健康保険協会',
  policyNumber: '12345678',
  notes: 'メモ',
  createdAt: new Date(),
};

const createMockRepository = (): InsuranceRepository => ({
  getAll: vi.fn().mockResolvedValue([mockInsurance]),
  create: vi.fn().mockResolvedValue(mockInsurance),
  update: vi.fn().mockResolvedValue({ ...mockInsurance, insuranceType: '生命保険' }),
  delete: vi.fn().mockResolvedValue(undefined),
});

describe('GetInsurances', () => {
  it('保険一覧を取得する', async () => {
    const repo = createMockRepository();
    const useCase = new GetInsurances(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].insuranceType).toBe('健康保険');
    expect(repo.getAll).toHaveBeenCalled();
  });

  it('空の配列を返す場合もエラーにならない', async () => {
    const repo = createMockRepository();
    (repo.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const useCase = new GetInsurances(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(0);
  });

  it('リポジトリがエラーを投げた場合そのまま伝搬する', async () => {
    const repo = createMockRepository();
    (repo.getAll as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB接続エラー'));
    const useCase = new GetInsurances(repo);

    await expect(useCase.execute()).rejects.toThrow('DB接続エラー');
  });
});

describe('CreateInsurance', () => {
  it('有効な入力で保険を作成する', async () => {
    const repo = createMockRepository();
    const useCase = new CreateInsurance(repo);
    const result = await useCase.execute({
      memberId: 'mem-1',
      insuranceType: '健康保険',
    });

    expect(result.insuranceType).toBe('健康保険');
    expect(repo.create).toHaveBeenCalledWith({
      memberId: 'mem-1',
      insuranceType: '健康保険',
    });
  });

  it('全フィールド指定で保険を作成する', async () => {
    const repo = createMockRepository();
    const useCase = new CreateInsurance(repo);
    await useCase.execute({
      memberId: 'mem-1',
      insuranceType: '生命保険',
      providerName: 'テスト保険会社',
      policyNumber: 'POL-001',
      notes: '年次更新',
    });

    expect(repo.create).toHaveBeenCalledWith({
      memberId: 'mem-1',
      insuranceType: '生命保険',
      providerName: 'テスト保険会社',
      policyNumber: 'POL-001',
      notes: '年次更新',
    });
  });

  it('メンバーIDが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateInsurance(repo);

    await expect(
      useCase.execute({
        memberId: '',
        insuranceType: '健康保険',
      })
    ).rejects.toThrow('メンバーIDは必須です');
  });

  it('保険種類が空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateInsurance(repo);

    await expect(
      useCase.execute({
        memberId: 'mem-1',
        insuranceType: '',
      })
    ).rejects.toThrow('保険の種類は必須です');
  });
});

describe('UpdateInsurance', () => {
  it('保険情報を更新する', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateInsurance(repo);
    const result = await useCase.execute('ins-1', { insuranceType: '生命保険' });

    expect(result.insuranceType).toBe('生命保険');
    expect(repo.update).toHaveBeenCalledWith('ins-1', { insuranceType: '生命保険' });
  });

  it('IDが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateInsurance(repo);

    await expect(
      useCase.execute('', { insuranceType: '更新' })
    ).rejects.toThrow('保険IDは必須です');
  });

  it('任意フィールドをnullで更新できる', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateInsurance(repo);
    await useCase.execute('ins-1', { providerName: null, policyNumber: null });

    expect(repo.update).toHaveBeenCalledWith('ins-1', { providerName: null, policyNumber: null });
  });
});

describe('DeleteInsurance', () => {
  it('保険を削除する', async () => {
    const repo = createMockRepository();
    const useCase = new DeleteInsurance(repo);
    await useCase.execute('ins-1');

    expect(repo.delete).toHaveBeenCalledWith('ins-1');
  });

  it('リポジトリエラーが伝搬する', async () => {
    const repo = createMockRepository();
    (repo.delete as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('削除エラー'));
    const useCase = new DeleteInsurance(repo);

    await expect(useCase.execute('ins-1')).rejects.toThrow('削除エラー');
  });
});
