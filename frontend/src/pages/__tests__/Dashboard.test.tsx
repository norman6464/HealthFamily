import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

// scheduleApiをモック（全曜日を含めてフィルタリングを通過させる）
vi.mock('../../data/api/scheduleApi', () => ({
  scheduleApi: {
    getTodaySchedules: vi.fn().mockResolvedValue([
      {
        schedule: {
          id: '1',
          medicationId: 'med-1',
          userId: 'user-1',
          memberId: 'member-1',
          scheduledTime: '08:00',
          daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          isEnabled: true,
          reminderMinutesBefore: 10,
          createdAt: new Date(),
        },
        medicationName: '血圧の薬',
        memberName: 'パパ',
        memberType: 'human',
        isCompleted: false,
      },
    ]),
    markAsCompleted: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ヘッダーが表示される', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('HealthFamily')).toBeInTheDocument();
  });

  it('キャラクターメッセージが表示される', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // デフォルトはcat
    expect(screen.getByText(/にゃ/)).toBeInTheDocument();
  });

  it('今日の予定セクションが表示される', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('今日の予定')).toBeInTheDocument();
  });

  it('スケジュールが読み込まれる', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('血圧の薬')).toBeInTheDocument();
    });
  });

  it('BottomNavigationが表示される', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('メンバー')).toBeInTheDocument();
  });
});
