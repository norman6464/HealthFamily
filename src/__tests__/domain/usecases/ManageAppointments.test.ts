import { describe, it, expect, vi } from 'vitest';
import { GetAppointments, CreateAppointment, DeleteAppointment } from '@/domain/usecases/ManageAppointments';
import { AppointmentRepository } from '@/domain/repositories/AppointmentRepository';
import { Appointment } from '@/domain/entities/Appointment';

const mockAppointment: Appointment = {
  id: 'apt-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: 'テスト太郎',
  appointmentDate: new Date('2025-06-01'),
  reminderEnabled: true,
  reminderDaysBefore: 1,
  createdAt: new Date(),
};

const createMockRepository = (): AppointmentRepository => ({
  getAppointments: vi.fn().mockResolvedValue([mockAppointment]),
  createAppointment: vi.fn().mockResolvedValue(mockAppointment),
  deleteAppointment: vi.fn().mockResolvedValue(undefined),
});

describe('GetAppointments', () => {
  it('予約一覧をViewModelとして取得する', async () => {
    const repo = createMockRepository();
    const useCase = new GetAppointments(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].appointment).toBe(mockAppointment);
    expect(result[0].entity).toBeDefined();
    expect(repo.getAppointments).toHaveBeenCalled();
  });
});

describe('CreateAppointment', () => {
  it('有効な入力で予約を作成する', async () => {
    const repo = createMockRepository();
    const useCase = new CreateAppointment(repo);
    const result = await useCase.execute({
      memberId: 'member-1',
      appointmentDate: '2025-06-01',
    });

    expect(result).toBe(mockAppointment);
    expect(repo.createAppointment).toHaveBeenCalled();
  });

  it('メンバーIDが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateAppointment(repo);

    await expect(
      useCase.execute({ memberId: '', appointmentDate: '2025-06-01' })
    ).rejects.toThrow('メンバーIDは必須です');
  });

  it('予約日が空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateAppointment(repo);

    await expect(
      useCase.execute({ memberId: 'member-1', appointmentDate: '' })
    ).rejects.toThrow('予約日は必須です');
  });
});

describe('DeleteAppointment', () => {
  it('予約を削除する', async () => {
    const repo = createMockRepository();
    const useCase = new DeleteAppointment(repo);
    await useCase.execute('apt-1');

    expect(repo.deleteAppointment).toHaveBeenCalledWith('apt-1');
  });
});
