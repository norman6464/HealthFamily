import { describe, it, expect, vi } from 'vitest';
import { GetAppointments, CreateAppointment, UpdateAppointment, DeleteAppointment } from '@/domain/usecases/ManageAppointments';
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
  updateAppointment: vi.fn().mockResolvedValue(mockAppointment),
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

  it('空の配列を返す場合もエラーにならない', async () => {
    const repo = createMockRepository();
    (repo.getAppointments as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const useCase = new GetAppointments(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(0);
  });

  it('リポジトリがエラーを投げた場合そのまま伝搬する', async () => {
    const repo = createMockRepository();
    (repo.getAppointments as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB接続エラー'));
    const useCase = new GetAppointments(repo);

    await expect(useCase.execute()).rejects.toThrow('DB接続エラー');
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

describe('UpdateAppointment', () => {
  it('有効な入力で予約を更新する', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateAppointment(repo);
    const result = await useCase.execute('apt-1', {
      appointmentDate: '2025-07-01',
      type: 'checkup',
      notes: '更新メモ',
    });

    expect(result).toBe(mockAppointment);
    expect(repo.updateAppointment).toHaveBeenCalledWith('apt-1', {
      appointmentDate: '2025-07-01',
      type: 'checkup',
      notes: '更新メモ',
    });
  });

  it('予約IDが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateAppointment(repo);

    await expect(
      useCase.execute('', { appointmentDate: '2025-07-01' })
    ).rejects.toThrow('予約IDは必須です');
  });

  it('更新フィールドが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateAppointment(repo);

    await expect(
      useCase.execute('apt-1', {})
    ).rejects.toThrow('更新するフィールドがありません');
  });
});

describe('DeleteAppointment', () => {
  it('予約を削除する', async () => {
    const repo = createMockRepository();
    const useCase = new DeleteAppointment(repo);
    await useCase.execute('apt-1');

    expect(repo.deleteAppointment).toHaveBeenCalledWith('apt-1');
  });

  it('リポジトリがエラーを投げた場合そのまま伝搬する', async () => {
    const repo = createMockRepository();
    (repo.deleteAppointment as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('削除失敗'));
    const useCase = new DeleteAppointment(repo);

    await expect(useCase.execute('apt-1')).rejects.toThrow('削除失敗');
  });
});
