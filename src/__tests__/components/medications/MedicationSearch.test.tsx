import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MedicationSearch } from '@/components/medications/MedicationSearch';
import { medicationApi } from '@/data/api/medicationApi';

vi.mock('@/data/api/medicationApi', () => ({
  medicationApi: {
    searchMedications: vi.fn(),
  },
}));

const mockSearch = vi.mocked(medicationApi.searchMedications);

describe('MedicationSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('検索入力欄と検索ボタンを表示する', () => {
    render(<MedicationSearch />);
    expect(screen.getByPlaceholderText('お薬名で検索...')).toBeInTheDocument();
    expect(screen.getByText('検索')).toBeInTheDocument();
  });

  it('空の入力では検索ボタンが無効になる', () => {
    render(<MedicationSearch />);
    expect(screen.getByText('検索')).toBeDisabled();
  });

  it('検索結果を表示する', async () => {
    mockSearch.mockResolvedValue([
      { id: '1', name: 'アスピリン', category: 'regular', memberId: 'm1', memberName: '太郎' },
    ]);

    render(<MedicationSearch />);
    fireEvent.change(screen.getByPlaceholderText('お薬名で検索...'), { target: { value: 'アスピリン' } });
    fireEvent.click(screen.getByText('検索'));

    await waitFor(() => {
      expect(screen.getByText('アスピリン')).toBeInTheDocument();
      expect(screen.getByText('(太郎)')).toBeInTheDocument();
    });
  });

  it('結果がない場合はメッセージを表示する', async () => {
    mockSearch.mockResolvedValue([]);

    render(<MedicationSearch />);
    fireEvent.change(screen.getByPlaceholderText('お薬名で検索...'), { target: { value: 'なし' } });
    fireEvent.click(screen.getByText('検索'));

    await waitFor(() => {
      expect(screen.getByText('該当するお薬が見つかりません')).toBeInTheDocument();
    });
  });

  it('Enterキーで検索できる', async () => {
    mockSearch.mockResolvedValue([]);

    render(<MedicationSearch />);
    const input = screen.getByPlaceholderText('お薬名で検索...');
    fireEvent.change(input, { target: { value: 'テスト' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith('テスト');
    });
  });

  it('結果をクリックするとonSelectResultが呼ばれる', async () => {
    const result = { id: '1', name: 'アスピリン', category: 'regular', memberId: 'm1', memberName: '太郎' };
    mockSearch.mockResolvedValue([result]);
    const onSelect = vi.fn();

    render(<MedicationSearch onSelectResult={onSelect} />);
    fireEvent.change(screen.getByPlaceholderText('お薬名で検索...'), { target: { value: 'アスピリン' } });
    fireEvent.click(screen.getByText('検索'));

    await waitFor(() => {
      expect(screen.getByText('アスピリン')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('アスピリン'));
    expect(onSelect).toHaveBeenCalledWith(result);
  });
});
