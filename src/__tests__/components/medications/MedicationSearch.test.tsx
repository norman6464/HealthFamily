import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MedicationSearch } from '@/components/medications/MedicationSearch';
import { useMedicationSearch } from '@/presentation/hooks/useMedicationSearch';

vi.mock('@/presentation/hooks/useMedicationSearch');

const mockSearch = vi.fn();
const mockUseMedicationSearch = vi.mocked(useMedicationSearch);

describe('MedicationSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMedicationSearch.mockReturnValue({
      results: [],
      isSearching: false,
      hasSearched: false,
      search: mockSearch,
    });
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

  it('検索結果を表示する', () => {
    mockUseMedicationSearch.mockReturnValue({
      results: [{ id: '1', name: 'アスピリン', category: 'regular', memberId: 'm1', memberName: '太郎' }],
      isSearching: false,
      hasSearched: true,
      search: mockSearch,
    });

    render(<MedicationSearch />);
    expect(screen.getByText('アスピリン')).toBeInTheDocument();
    expect(screen.getByText('(太郎)')).toBeInTheDocument();
  });

  it('結果がない場合はメッセージを表示する', () => {
    mockUseMedicationSearch.mockReturnValue({
      results: [],
      isSearching: false,
      hasSearched: true,
      search: mockSearch,
    });

    render(<MedicationSearch />);
    expect(screen.getByText('該当するお薬が見つかりません')).toBeInTheDocument();
  });

  it('検索ボタンをクリックするとsearchが呼ばれる', () => {
    render(<MedicationSearch />);
    fireEvent.change(screen.getByPlaceholderText('お薬名で検索...'), { target: { value: 'テスト' } });
    fireEvent.click(screen.getByText('検索'));
    expect(mockSearch).toHaveBeenCalledWith('テスト');
  });

  it('Enterキーで検索できる', () => {
    render(<MedicationSearch />);
    const input = screen.getByPlaceholderText('お薬名で検索...');
    fireEvent.change(input, { target: { value: 'テスト' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSearch).toHaveBeenCalledWith('テスト');
  });

  it('結果をクリックするとonSelectResultが呼ばれる', () => {
    const result = { id: '1', name: 'アスピリン', category: 'regular', memberId: 'm1', memberName: '太郎' };
    mockUseMedicationSearch.mockReturnValue({
      results: [result],
      isSearching: false,
      hasSearched: true,
      search: mockSearch,
    });
    const onSelect = vi.fn();

    render(<MedicationSearch onSelectResult={onSelect} />);
    fireEvent.click(screen.getByText('アスピリン'));
    expect(onSelect).toHaveBeenCalledWith(result);
  });
});
