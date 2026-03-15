import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetBodyMeasurements, CreateBodyMeasurement, UpdateBodyMeasurement, DeleteBodyMeasurement } from '../../../domain/usecases/ManageBodyMeasurements';
import { BodyMeasurementRepository, CreateBodyMeasurementInput, UpdateBodyMeasurementInput } from '../../../domain/repositories/BodyMeasurementRepository';
import { BodyMeasurement } from '../../../domain/entities/BodyMeasurement';

const mockMeasurement: BodyMeasurement = {
  id: 'measurement-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: 'テスト太郎',
  weight: 65.5,
  height: 170.0,
  recordedAt: new Date('2024-03-15'),
  notes: '朝食前に測定',
  createdAt: new Date('2024-03-15'),
};

const createMockRepository = (): BodyMeasurementRepository => ({
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe('ManageBodyMeasurements', () => {
  let mockRepository: BodyMeasurementRepository;

  beforeEach(() => {
    mockRepository = createMockRepository();
  });

  describe('GetBodyMeasurements', () => {
    it('全ての体重・身長記録を取得できる', async () => {
      const measurements = [mockMeasurement];
      vi.mocked(mockRepository.getAll).mockResolvedValue(measurements);

      const useCase = new GetBodyMeasurements(mockRepository);
      const result = await useCase.execute();

      expect(result).toEqual(measurements);
      expect(mockRepository.getAll).toHaveBeenCalledOnce();
    });

    it('記録が0件の場合は空配列を返す', async () => {
      vi.mocked(mockRepository.getAll).mockResolvedValue([]);

      const useCase = new GetBodyMeasurements(mockRepository);
      const result = await useCase.execute();

      expect(result).toEqual([]);
    });
  });

  describe('CreateBodyMeasurement', () => {
    it('体重・身長記録を作成できる', async () => {
      const input: CreateBodyMeasurementInput = {
        memberId: 'member-1',
        weight: 65.5,
        height: 170.0,
        recordedAt: '2024-03-15',
        notes: '朝食前に測定',
      };
      vi.mocked(mockRepository.create).mockResolvedValue(mockMeasurement);

      const useCase = new CreateBodyMeasurement(mockRepository);
      const result = await useCase.execute(input);

      expect(result).toEqual(mockMeasurement);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it('体重のみで作成できる', async () => {
      const input: CreateBodyMeasurementInput = {
        memberId: 'member-1',
        weight: 65.5,
        recordedAt: '2024-03-15',
      };
      vi.mocked(mockRepository.create).mockResolvedValue({ ...mockMeasurement, height: undefined });

      const useCase = new CreateBodyMeasurement(mockRepository);
      const result = await useCase.execute(input);

      expect(result.height).toBeUndefined();
    });

    it('身長のみで作成できる', async () => {
      const input: CreateBodyMeasurementInput = {
        memberId: 'member-1',
        height: 170.0,
        recordedAt: '2024-03-15',
      };
      vi.mocked(mockRepository.create).mockResolvedValue({ ...mockMeasurement, weight: undefined });

      const useCase = new CreateBodyMeasurement(mockRepository);
      const result = await useCase.execute(input);

      expect(result.weight).toBeUndefined();
    });

    it('メンバーIDが空の場合エラーになる', async () => {
      const input: CreateBodyMeasurementInput = {
        memberId: '',
        weight: 65.5,
        recordedAt: '2024-03-15',
      };

      const useCase = new CreateBodyMeasurement(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('メンバーIDは必須です');
    });

    it('記録日が空の場合エラーになる', async () => {
      const input: CreateBodyMeasurementInput = {
        memberId: 'member-1',
        weight: 65.5,
        recordedAt: '',
      };

      const useCase = new CreateBodyMeasurement(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('記録日は必須です');
    });

    it('体重も身長も未入力の場合エラーになる', async () => {
      const input: CreateBodyMeasurementInput = {
        memberId: 'member-1',
        recordedAt: '2024-03-15',
      };

      const useCase = new CreateBodyMeasurement(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('体重または身長のいずれかは必須です');
    });
  });

  describe('UpdateBodyMeasurement', () => {
    it('記録を更新できる', async () => {
      const input: UpdateBodyMeasurementInput = {
        weight: 64.0,
      };
      const updated = { ...mockMeasurement, weight: 64.0 };
      vi.mocked(mockRepository.update).mockResolvedValue(updated);

      const useCase = new UpdateBodyMeasurement(mockRepository);
      const result = await useCase.execute('measurement-1', input);

      expect(result).toEqual(updated);
      expect(mockRepository.update).toHaveBeenCalledWith('measurement-1', input);
    });

    it('IDが空の場合エラーになる', async () => {
      const useCase = new UpdateBodyMeasurement(mockRepository);
      await expect(useCase.execute('', { weight: 64.0 })).rejects.toThrow('記録IDは必須です');
    });
  });

  describe('DeleteBodyMeasurement', () => {
    it('記録を削除できる', async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      const useCase = new DeleteBodyMeasurement(mockRepository);
      await useCase.execute('measurement-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('measurement-1');
    });
  });
});
