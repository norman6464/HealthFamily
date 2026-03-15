import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetAllergies, CreateAllergy, UpdateAllergy, DeleteAllergy } from '../../../domain/usecases/ManageAllergies';
import { AllergyRepository, CreateAllergyInput, UpdateAllergyInput } from '../../../domain/repositories/AllergyRepository';
import { Allergy } from '../../../domain/entities/Allergy';

const mockAllergy: Allergy = {
  id: 'allergy-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: 'テスト太郎',
  allergenName: 'ピーナッツ',
  allergyType: 'food',
  severity: 'severe',
  symptoms: 'じんましん、呼吸困難',
  diagnosedAt: new Date('2024-01-15'),
  notes: 'エピペン携帯',
  createdAt: new Date('2024-01-15'),
};

const createMockRepository = (): AllergyRepository => ({
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe('ManageAllergies', () => {
  let mockRepository: AllergyRepository;

  beforeEach(() => {
    mockRepository = createMockRepository();
  });

  describe('GetAllergies', () => {
    it('全てのアレルギーを取得できる', async () => {
      const allergies = [mockAllergy];
      vi.mocked(mockRepository.getAll).mockResolvedValue(allergies);

      const useCase = new GetAllergies(mockRepository);
      const result = await useCase.execute();

      expect(result).toEqual(allergies);
      expect(mockRepository.getAll).toHaveBeenCalledOnce();
    });

    it('アレルギーが0件の場合は空配列を返す', async () => {
      vi.mocked(mockRepository.getAll).mockResolvedValue([]);

      const useCase = new GetAllergies(mockRepository);
      const result = await useCase.execute();

      expect(result).toEqual([]);
    });
  });

  describe('CreateAllergy', () => {
    it('アレルギーを作成できる', async () => {
      const input: CreateAllergyInput = {
        memberId: 'member-1',
        allergenName: 'ピーナッツ',
        allergyType: 'food',
        severity: 'severe',
        symptoms: 'じんましん',
        notes: 'エピペン携帯',
      };
      vi.mocked(mockRepository.create).mockResolvedValue(mockAllergy);

      const useCase = new CreateAllergy(mockRepository);
      const result = await useCase.execute(input);

      expect(result).toEqual(mockAllergy);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it('メンバーIDが空の場合エラーになる', async () => {
      const input: CreateAllergyInput = {
        memberId: '',
        allergenName: 'ピーナッツ',
        allergyType: 'food',
        severity: 'severe',
      };

      const useCase = new CreateAllergy(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('メンバーIDは必須です');
    });

    it('アレルゲン名が空の場合エラーになる', async () => {
      const input: CreateAllergyInput = {
        memberId: 'member-1',
        allergenName: '',
        allergyType: 'food',
        severity: 'severe',
      };

      const useCase = new CreateAllergy(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('アレルゲン名は必須です');
    });

    it('アレルギー種類が空の場合エラーになる', async () => {
      const input: CreateAllergyInput = {
        memberId: 'member-1',
        allergenName: 'ピーナッツ',
        allergyType: '',
        severity: 'severe',
      };

      const useCase = new CreateAllergy(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('アレルギーの種類は必須です');
    });

    it('重症度が空の場合エラーになる', async () => {
      const input: CreateAllergyInput = {
        memberId: 'member-1',
        allergenName: 'ピーナッツ',
        allergyType: 'food',
        severity: '',
      };

      const useCase = new CreateAllergy(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('重症度は必須です');
    });
  });

  describe('UpdateAllergy', () => {
    it('アレルギーを更新できる', async () => {
      const input: UpdateAllergyInput = {
        allergenName: '卵',
        severity: 'mild',
      };
      const updated = { ...mockAllergy, allergenName: '卵', severity: 'mild' as const };
      vi.mocked(mockRepository.update).mockResolvedValue(updated);

      const useCase = new UpdateAllergy(mockRepository);
      const result = await useCase.execute('allergy-1', input);

      expect(result).toEqual(updated);
      expect(mockRepository.update).toHaveBeenCalledWith('allergy-1', input);
    });

    it('IDが空の場合エラーになる', async () => {
      const useCase = new UpdateAllergy(mockRepository);
      await expect(useCase.execute('', { allergenName: '卵' })).rejects.toThrow('アレルギーIDは必須です');
    });
  });

  describe('DeleteAllergy', () => {
    it('アレルギーを削除できる', async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      const useCase = new DeleteAllergy(mockRepository);
      await useCase.execute('allergy-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('allergy-1');
    });
  });
});
