import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetPrescriptions, CreatePrescription, UpdatePrescription, DeletePrescription } from '../../../domain/usecases/ManagePrescriptions';
import { PrescriptionRepository, CreatePrescriptionInput, UpdatePrescriptionInput } from '../../../domain/repositories/PrescriptionRepository';
import { Prescription } from '../../../domain/entities/Prescription';

const mockPrescription: Prescription = {
  id: 'prescription-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: 'テスト太郎',
  prescriptionName: '高血圧治療薬',
  prescribedBy: '山田医師',
  prescribedAt: new Date('2024-03-01'),
  expiresAt: new Date('2024-06-01'),
  pharmacyName: '調剤薬局ABC',
  notes: '毎月リフィル可',
  createdAt: new Date('2024-03-01'),
};

const createMockRepository = (): PrescriptionRepository => ({
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe('ManagePrescriptions', () => {
  let mockRepository: PrescriptionRepository;

  beforeEach(() => {
    mockRepository = createMockRepository();
  });

  describe('GetPrescriptions', () => {
    it('全ての処方箋を取得できる', async () => {
      vi.mocked(mockRepository.getAll).mockResolvedValue([mockPrescription]);

      const useCase = new GetPrescriptions(mockRepository);
      const result = await useCase.execute();

      expect(result).toEqual([mockPrescription]);
    });
  });

  describe('CreatePrescription', () => {
    it('処方箋を作成できる', async () => {
      const input: CreatePrescriptionInput = {
        memberId: 'member-1',
        prescriptionName: '高血圧治療薬',
        prescribedBy: '山田医師',
        prescribedAt: '2024-03-01',
      };
      vi.mocked(mockRepository.create).mockResolvedValue(mockPrescription);

      const useCase = new CreatePrescription(mockRepository);
      const result = await useCase.execute(input);

      expect(result).toEqual(mockPrescription);
    });

    it('メンバーIDが空の場合エラーになる', async () => {
      const input: CreatePrescriptionInput = {
        memberId: '',
        prescriptionName: '高血圧治療薬',
        prescribedAt: '2024-03-01',
      };

      const useCase = new CreatePrescription(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('メンバーIDは必須です');
    });

    it('処方箋名が空の場合エラーになる', async () => {
      const input: CreatePrescriptionInput = {
        memberId: 'member-1',
        prescriptionName: '',
        prescribedAt: '2024-03-01',
      };

      const useCase = new CreatePrescription(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('処方箋名は必須です');
    });

    it('処方日が空の場合エラーになる', async () => {
      const input: CreatePrescriptionInput = {
        memberId: 'member-1',
        prescriptionName: '高血圧治療薬',
        prescribedAt: '',
      };

      const useCase = new CreatePrescription(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('処方日は必須です');
    });
  });

  describe('UpdatePrescription', () => {
    it('処方箋を更新できる', async () => {
      const input: UpdatePrescriptionInput = { prescriptionName: '降圧剤' };
      const updated = { ...mockPrescription, prescriptionName: '降圧剤' };
      vi.mocked(mockRepository.update).mockResolvedValue(updated);

      const useCase = new UpdatePrescription(mockRepository);
      const result = await useCase.execute('prescription-1', input);

      expect(result).toEqual(updated);
    });

    it('IDが空の場合エラーになる', async () => {
      const useCase = new UpdatePrescription(mockRepository);
      await expect(useCase.execute('', { prescriptionName: 'test' })).rejects.toThrow('処方箋IDは必須です');
    });
  });

  describe('DeletePrescription', () => {
    it('処方箋を削除できる', async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      const useCase = new DeletePrescription(mockRepository);
      await useCase.execute('prescription-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('prescription-1');
    });
  });
});
