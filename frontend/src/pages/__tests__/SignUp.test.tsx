import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUp from '../SignUp';
import { useAuthStore } from '../../stores/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('SignUp', () => {
  const mockSignUp = vi.fn();
  const mockConfirmSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      signUp: mockSignUp,
      confirmSignUp: mockConfirmSignUp,
    } as never);
  });

  function renderSignUp() {
    return render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );
  }

  it('新規登録フォームが表示される', () => {
    renderSignUp();

    expect(screen.getByText('HealthFamily')).toBeInTheDocument();
    expect(screen.getByText('新規登録')).toBeInTheDocument();
    expect(screen.getByLabelText('表示名')).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
  });

  it('登録成功時に確認画面に遷移する', async () => {
    mockSignUp.mockResolvedValueOnce({ needsConfirmation: true });
    renderSignUp();

    fireEvent.change(screen.getByLabelText('表示名'), { target: { value: 'テストユーザー' } });
    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: '登録' }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'Password123', 'テストユーザー');
      expect(screen.getByText('メール認証')).toBeInTheDocument();
    });
  });

  it('確認不要の場合ログイン画面に遷移する', async () => {
    mockSignUp.mockResolvedValueOnce({ needsConfirmation: false });
    renderSignUp();

    fireEvent.change(screen.getByLabelText('表示名'), { target: { value: 'テスト' } });
    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: '登録' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('UsernameExistsExceptionでエラーメッセージを表示する', async () => {
    const err = new Error('User exists');
    err.name = 'UsernameExistsException';
    mockSignUp.mockRejectedValueOnce(err);
    renderSignUp();

    fireEvent.change(screen.getByLabelText('表示名'), { target: { value: 'テスト' } });
    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: '登録' }));

    await waitFor(() => {
      expect(screen.getByText('このメールアドレスは既に登録されています')).toBeInTheDocument();
    });
  });

  it('その他のエラーでエラーメッセージを表示する', async () => {
    mockSignUp.mockRejectedValueOnce(new Error('Some error'));
    renderSignUp();

    fireEvent.change(screen.getByLabelText('表示名'), { target: { value: 'テスト' } });
    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: '登録' }));

    await waitFor(() => {
      expect(screen.getByText('Some error')).toBeInTheDocument();
    });
  });

  it('Error以外の例外でデフォルトメッセージを表示する', async () => {
    mockSignUp.mockRejectedValueOnce('string error');
    renderSignUp();

    fireEvent.change(screen.getByLabelText('表示名'), { target: { value: 'テスト' } });
    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: '登録' }));

    await waitFor(() => {
      expect(screen.getByText('登録に失敗しました')).toBeInTheDocument();
    });
  });

  it('確認コードを送信してログイン画面に遷移する', async () => {
    mockSignUp.mockResolvedValueOnce({ needsConfirmation: true });
    mockConfirmSignUp.mockResolvedValueOnce(undefined);
    renderSignUp();

    // First register
    fireEvent.change(screen.getByLabelText('表示名'), { target: { value: 'テスト' } });
    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: '登録' }));

    await waitFor(() => {
      expect(screen.getByText('メール認証')).toBeInTheDocument();
    });

    // Then confirm
    fireEvent.change(screen.getByLabelText('認証コード'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: '認証する' }));

    await waitFor(() => {
      expect(mockConfirmSignUp).toHaveBeenCalledWith('test@example.com', '123456');
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: { registered: true } });
    });
  });

  it('確認コードエラーでCodeMismatchExceptionのメッセージを表示する', async () => {
    mockSignUp.mockResolvedValueOnce({ needsConfirmation: true });
    renderSignUp();

    fireEvent.change(screen.getByLabelText('表示名'), { target: { value: 'テスト' } });
    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: '登録' }));

    await waitFor(() => {
      expect(screen.getByText('メール認証')).toBeInTheDocument();
    });

    const codeErr = new Error('Code mismatch');
    codeErr.name = 'CodeMismatchException';
    mockConfirmSignUp.mockRejectedValueOnce(codeErr);

    fireEvent.change(screen.getByLabelText('認証コード'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: '認証する' }));

    await waitFor(() => {
      expect(screen.getByText('認証コードが正しくありません')).toBeInTheDocument();
    });
  });

  it('確認でError以外の例外でデフォルトメッセージを表示する', async () => {
    mockSignUp.mockResolvedValueOnce({ needsConfirmation: true });
    renderSignUp();

    fireEvent.change(screen.getByLabelText('表示名'), { target: { value: 'テスト' } });
    fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: '登録' }));

    await waitFor(() => {
      expect(screen.getByText('メール認証')).toBeInTheDocument();
    });

    mockConfirmSignUp.mockRejectedValueOnce('string error');

    fireEvent.change(screen.getByLabelText('認証コード'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: '認証する' }));

    await waitFor(() => {
      expect(screen.getByText('認証に失敗しました')).toBeInTheDocument();
    });
  });

  it('ログインリンクが表示される', () => {
    renderSignUp();
    expect(screen.getByText('ログイン')).toBeInTheDocument();
  });
});
