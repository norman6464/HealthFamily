import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Medications from '../Medications';

const mockCreateMedication = vi.fn().mockResolvedValue({
  id: 'med-2',
  name: '新しい薬',
  category: 'regular',
  createdAt: new Date(),
});
const mockDeleteMedication = vi.fn().mockResolvedValue(undefined);

// medicationApiをモック
vi.mock('../../data/api/medicationApi', () => ({
  medicationApi: {
    getMedicationsByMember: vi.fn().mockResolvedValue([
      {
        id: 'med-1',
        memberId: 'member-1',
        userId: 'user-1',
        name: '血圧の薬',
        category: 'regular',
        dosageAmount: '1錠',
        frequency: '1日1回',
        stockQuantity: 30,
        lowStockThreshold: 5,
        isActive: true,
        createdAt: new Date(),
      },
    ]),
    createMedication: (...args: unknown[]) => mockCreateMedication(...args),
    getMedicationById: vi.fn().mockResolvedValue({
      id: 'med-1',
      name: '血圧の薬',
    }),
    deleteMedication: (...args: unknown[]) => mockDeleteMedication(...args),
  },
}));

const renderWithRouter = () => {
  return render(
    <MemoryRouter initialEntries={['/members/member-1/medications']}>
      <Routes>
        <Route path="/members/:memberId/medications" element={<Medications />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Medications Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ヘッダーが表示される', () => {
    renderWithRouter();

    expect(screen.getByText('お薬管理')).toBeInTheDocument();
  });

  it('追加ボタンが表示される', () => {
    renderWithRouter();

    expect(screen.getByText('+ 追加')).toBeInTheDocument();
  });

  it('戻るリンクが表示される', () => {
    renderWithRouter();

    expect(screen.getByText('←')).toBeInTheDocument();
  });

  it('薬一覧が読み込まれる', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('血圧の薬')).toBeInTheDocument();
    });
  });

  it('追加ボタンでフォームが表示される', () => {
    renderWithRouter();

    fireEvent.click(screen.getByText('+ 追加'));

    expect(screen.getByText('新しい薬を追加')).toBeInTheDocument();
    expect(screen.getByText('閉じる')).toBeInTheDocument();
  });

  it('フォーム送信で薬が作成される', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    // フォームを開く
    await user.click(screen.getByText('+ 追加'));

    // 薬名を入力して送信
    await user.type(screen.getByPlaceholderText('薬の名前を入力'), '胃薬');
    await user.click(screen.getByText('追加する'));

    await waitFor(() => {
      expect(mockCreateMedication).toHaveBeenCalled();
    });
  });

  it('フォーム送信後にフォームが閉じる', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.click(screen.getByText('+ 追加'));
    expect(screen.getByText('新しい薬を追加')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('薬の名前を入力'), '胃薬');
    await user.click(screen.getByText('追加する'));

    await waitFor(() => {
      expect(screen.queryByText('新しい薬を追加')).not.toBeInTheDocument();
    });
  });

  it('削除ボタンで薬が削除される', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('血圧の薬')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('削除');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteMedication).toHaveBeenCalledWith('med-1');
    });
  });
});
