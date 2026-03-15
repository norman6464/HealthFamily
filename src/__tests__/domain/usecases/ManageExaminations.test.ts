import { describe, it, expect, vi } from 'vitest';
import {
  GetExaminations,
  CreateExamination,
  UpdateExamination,
  DeleteExamination,
} from '@/domain/usecases/ManageExaminations';
import { ExaminationRepository } from '@/domain/repositories/ExaminationRepository';
import { Examination } from '@/domain/entities/Examination';

const mockExamination: Examination = {
  id: 'exam-1',
  userId: 'user-1',
  memberId: 'mem-1',
  memberName: 'テスト太郎',
  examinationType: '血液検査',
  examinedAt: new Date('2025-12-01'),
  nextScheduledDate: new Date('2026-06-01'),
  notes: '定期検査',
  createdAt: new Date(),
};

const createMockRepository = (): ExaminationRepository => ({
  getAll: vi.fn().mockResolvedValue([mockExamination]),
  create: vi.fn().mockResolvedValue(mockExamination),
  update: vi.fn().mockResolvedValue({ ...mockExamination, examinationType: '尿検査' }),
  delete: vi.fn().mockResolvedValue(undefined),
});

describe('GetExaminations', () => {
  it('検査一覧を取得する', async () => {
    const repo = createMockRepository();
    const useCase = new GetExaminations(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].examinationType).toBe('血液検査');
    expect(repo.getAll).toHaveBeenCalled();
  });

  it('空の配列を返す場合もエラーにならない', async () => {
    const repo = createMockRepository();
    (repo.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const useCase = new GetExaminations(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(0);
  });

  it('リポジトリがエラーを投げた場合そのまま伝搬する', async () => {
    const repo = createMockRepository();
    (repo.getAll as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB接続エラー'));
    const useCase = new GetExaminations(repo);

    await expect(useCase.execute()).rejects.toThrow('DB接続エラー');
  });
});

describe('CreateExamination', () => {
  it('有効な入力で検査を作成する', async () => {
    const repo = createMockRepository();
    const useCase = new CreateExamination(repo);
    const result = await useCase.execute({
      memberId: 'mem-1',
      examinationType: '血液検査',
      examinedAt: '2025-12-01',
    });

    expect(result.examinationType).toBe('血液検査');
    expect(repo.create).toHaveBeenCalledWith({
      memberId: 'mem-1',
      examinationType: '血液検査',
      examinedAt: '2025-12-01',
    });
  });

  it('次回予定日・メモ付きで検査を作成する', async () => {
    const repo = createMockRepository();
    const useCase = new CreateExamination(repo);
    await useCase.execute({
      memberId: 'mem-1',
      examinationType: '血液検査',
      examinedAt: '2025-12-01',
      nextScheduledDate: '2026-06-01',
      notes: '半年ごとの定期検査',
    });

    expect(repo.create).toHaveBeenCalledWith({
      memberId: 'mem-1',
      examinationType: '血液検査',
      examinedAt: '2025-12-01',
      nextScheduledDate: '2026-06-01',
      notes: '半年ごとの定期検査',
    });
  });

  it('メンバーIDが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateExamination(repo);

    await expect(
      useCase.execute({
        memberId: '',
        examinationType: '血液検査',
        examinedAt: '2025-12-01',
      })
    ).rejects.toThrow('メンバーIDは必須です');
  });

  it('検査種類が空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateExamination(repo);

    await expect(
      useCase.execute({
        memberId: 'mem-1',
        examinationType: '',
        examinedAt: '2025-12-01',
      })
    ).rejects.toThrow('検査の種類は必須です');
  });

  it('検査日が空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateExamination(repo);

    await expect(
      useCase.execute({
        memberId: 'mem-1',
        examinationType: '血液検査',
        examinedAt: '',
      })
    ).rejects.toThrow('検査日は必須です');
  });
});

describe('UpdateExamination', () => {
  it('検査情報を更新する', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateExamination(repo);
    const result = await useCase.execute('exam-1', { examinationType: '尿検査' });

    expect(result.examinationType).toBe('尿検査');
    expect(repo.update).toHaveBeenCalledWith('exam-1', { examinationType: '尿検査' });
  });

  it('IDが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateExamination(repo);

    await expect(
      useCase.execute('', { examinationType: '更新' })
    ).rejects.toThrow('検査IDは必須です');
  });

  it('次回予定日をnullで更新できる', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateExamination(repo);
    await useCase.execute('exam-1', { nextScheduledDate: null });

    expect(repo.update).toHaveBeenCalledWith('exam-1', { nextScheduledDate: null });
  });
});

describe('DeleteExamination', () => {
  it('検査を削除する', async () => {
    const repo = createMockRepository();
    const useCase = new DeleteExamination(repo);
    await useCase.execute('exam-1');

    expect(repo.delete).toHaveBeenCalledWith('exam-1');
  });

  it('リポジトリエラーが伝搬する', async () => {
    const repo = createMockRepository();
    (repo.delete as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('削除エラー'));
    const useCase = new DeleteExamination(repo);

    await expect(useCase.execute('exam-1')).rejects.toThrow('削除エラー');
  });
});
