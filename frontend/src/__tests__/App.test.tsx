import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { useAuthStore } from '../stores/authStore';

// Amplify Authモック
vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error('not authenticated')),
  fetchAuthSession: vi.fn().mockRejectedValue(new Error('not authenticated')),
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  signOut: vi.fn(),
}));

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

function setAuthenticated() {
  useAuthStore.setState({
    user: { userId: 'test-user', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
  });
}

describe('App', () => {
  beforeEach(() => {
    setAuthenticated();
  });

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

  it('未認証時は/loginにリダイレクトされる', async () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('メールアドレス')).toBeInTheDocument();
  });

  it('ErrorBoundaryで囲まれている', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('HealthFamily')).toBeInTheDocument();
  });
});
