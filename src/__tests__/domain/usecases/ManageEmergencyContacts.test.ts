import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetEmergencyContacts, CreateEmergencyContact, UpdateEmergencyContact, DeleteEmergencyContact } from '../../../domain/usecases/ManageEmergencyContacts';
import { EmergencyContactRepository, CreateEmergencyContactInput, UpdateEmergencyContactInput } from '../../../domain/repositories/EmergencyContactRepository';
import { EmergencyContact } from '../../../domain/entities/EmergencyContact';

const mockContact: EmergencyContact = {
  id: 'contact-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: 'テスト太郎',
  contactName: '田中花子',
  phoneNumber: '090-1234-5678',
  relationship: '母',
  notes: '日中連絡可',
  createdAt: new Date('2024-01-15'),
};

const createMockRepository = (): EmergencyContactRepository => ({
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe('ManageEmergencyContacts', () => {
  let mockRepository: EmergencyContactRepository;

  beforeEach(() => {
    mockRepository = createMockRepository();
  });

  describe('GetEmergencyContacts', () => {
    it('全ての緊急連絡先を取得できる', async () => {
      vi.mocked(mockRepository.getAll).mockResolvedValue([mockContact]);

      const useCase = new GetEmergencyContacts(mockRepository);
      const result = await useCase.execute();

      expect(result).toEqual([mockContact]);
      expect(mockRepository.getAll).toHaveBeenCalledOnce();
    });
  });

  describe('CreateEmergencyContact', () => {
    it('緊急連絡先を作成できる', async () => {
      const input: CreateEmergencyContactInput = {
        memberId: 'member-1',
        contactName: '田中花子',
        phoneNumber: '090-1234-5678',
        relationship: '母',
      };
      vi.mocked(mockRepository.create).mockResolvedValue(mockContact);

      const useCase = new CreateEmergencyContact(mockRepository);
      const result = await useCase.execute(input);

      expect(result).toEqual(mockContact);
    });

    it('メンバーIDが空の場合エラーになる', async () => {
      const input: CreateEmergencyContactInput = {
        memberId: '',
        contactName: '田中花子',
        phoneNumber: '090-1234-5678',
      };

      const useCase = new CreateEmergencyContact(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('メンバーIDは必須です');
    });

    it('連絡先名が空の場合エラーになる', async () => {
      const input: CreateEmergencyContactInput = {
        memberId: 'member-1',
        contactName: '',
        phoneNumber: '090-1234-5678',
      };

      const useCase = new CreateEmergencyContact(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('連絡先名は必須です');
    });

    it('電話番号が空の場合エラーになる', async () => {
      const input: CreateEmergencyContactInput = {
        memberId: 'member-1',
        contactName: '田中花子',
        phoneNumber: '',
      };

      const useCase = new CreateEmergencyContact(mockRepository);
      await expect(useCase.execute(input)).rejects.toThrow('電話番号は必須です');
    });
  });

  describe('UpdateEmergencyContact', () => {
    it('連絡先を更新できる', async () => {
      const input: UpdateEmergencyContactInput = { contactName: '山田太郎' };
      const updated = { ...mockContact, contactName: '山田太郎' };
      vi.mocked(mockRepository.update).mockResolvedValue(updated);

      const useCase = new UpdateEmergencyContact(mockRepository);
      const result = await useCase.execute('contact-1', input);

      expect(result).toEqual(updated);
    });

    it('IDが空の場合エラーになる', async () => {
      const useCase = new UpdateEmergencyContact(mockRepository);
      await expect(useCase.execute('', { contactName: 'test' })).rejects.toThrow('連絡先IDは必須です');
    });
  });

  describe('DeleteEmergencyContact', () => {
    it('連絡先を削除できる', async () => {
      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      const useCase = new DeleteEmergencyContact(mockRepository);
      await useCase.execute('contact-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('contact-1');
    });
  });
});
