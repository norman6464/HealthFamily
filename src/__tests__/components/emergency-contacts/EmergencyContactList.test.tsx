import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmergencyContactList } from '@/components/emergency-contacts/EmergencyContactList';
import { EmergencyContact } from '@/domain/entities/EmergencyContact';

const createContact = (overrides: Partial<EmergencyContact> = {}): EmergencyContact => ({
  id: 'ec-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  contactName: '田中花子',
  phoneNumber: '090-1234-5678',
  relationship: '母',
  notes: '日中連絡可',
  createdAt: new Date(),
  ...overrides,
});

describe('EmergencyContactList', () => {
  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('読み込み中を表示する', () => {
    render(<EmergencyContactList contacts={[]} isLoading={true} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('空状態を表示する', () => {
    render(<EmergencyContactList contacts={[]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('緊急連絡先が登録されていません')).toBeInTheDocument();
  });

  it('連絡先情報を表示する', () => {
    const contact = createContact();
    render(<EmergencyContactList contacts={[contact]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('田中花子')).toBeInTheDocument();
    expect(screen.getByText('090-1234-5678')).toBeInTheDocument();
    expect(screen.getByText('母')).toBeInTheDocument();
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText('日中連絡可')).toBeInTheDocument();
  });

  it('電話番号にtelリンクが設定されている', () => {
    const contact = createContact();
    render(<EmergencyContactList contacts={[contact]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    const phoneLink = screen.getByText('090-1234-5678');
    expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:090-1234-5678');
  });

  it('削除ボタンで確認ダイアログが表示される', () => {
    const contact = createContact();
    render(<EmergencyContactList contacts={[contact]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(screen.getByText(/削除しますか/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('確認'));
    expect(mockOnDelete).toHaveBeenCalledWith('ec-1');
  });

  it('編集ボタンで編集モードに切り替わる', () => {
    const contact = createContact();
    render(<EmergencyContactList contacts={[contact]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    expect(screen.getByDisplayValue('田中花子')).toBeInTheDocument();
    expect(screen.getByDisplayValue('090-1234-5678')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
  });

  it('編集キャンセルで元の表示に戻る', () => {
    const contact = createContact();
    render(<EmergencyContactList contacts={[contact]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.click(screen.getByText('キャンセル'));
    expect(screen.getByText('田中花子')).toBeInTheDocument();
    expect(screen.queryByText('保存')).not.toBeInTheDocument();
  });

  it('編集保存でonUpdateが呼ばれる', async () => {
    const contact = createContact();
    render(<EmergencyContactList contacts={[contact]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.change(screen.getByDisplayValue('田中花子'), { target: { value: '佐藤一郎' } });
    fireEvent.click(screen.getByText('保存'));
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('ec-1', expect.objectContaining({
        contactName: '佐藤一郎',
      }));
    });
  });

  it('複数の連絡先を表示する', () => {
    const contacts = [
      createContact({ id: 'ec-1', contactName: '田中花子' }),
      createContact({ id: 'ec-2', contactName: '佐藤一郎' }),
    ];
    render(<EmergencyContactList contacts={contacts} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('田中花子')).toBeInTheDocument();
    expect(screen.getByText('佐藤一郎')).toBeInTheDocument();
  });
});
