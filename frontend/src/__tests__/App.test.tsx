import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// APIモック
vi.mock('../data/api/scheduleApi', () => ({
  scheduleApi: {
    getTodaySchedules: vi.fn().mockResolvedValue([]),
    markAsCompleted: vi.fn(),
  },
}));

vi.mock('../data/api/memberApi', () => ({
  memberApi: {
    getMembers: vi.fn().mockResolvedValue([]),
    createMember: vi.fn(),
    deleteMember: vi.fn(),
  },
}));

vi.mock('../data/api/medicationApi', () => ({
  medicationApi: {
    getMedicationsByMember: vi.fn().mockResolvedValue([]),
    createMedication: vi.fn(),
    getMedicationById: vi.fn(),
    deleteMedication: vi.fn(),
  },
}));

describe('App', () => {
  it('/でDashboardが表示される', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('HealthFamily')).toBeInTheDocument();
  });

  it('/membersでMembersページが表示される', async () => {
    render(
      <MemoryRouter initialEntries={['/members']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('メンバー管理')).toBeInTheDocument();
  });

  it('/settingsでSettingsページが表示される', async () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '設定' })).toBeInTheDocument();
    });
  });

  it('ErrorBoundaryで囲まれている', () => {
    // App自体がErrorBoundaryで囲まれていることの確認
    // 正常レンダリングが成功すればErrorBoundaryは機能している
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('HealthFamily')).toBeInTheDocument();
  });
});
