import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionWithForm } from '@/components/shared/SectionWithForm';
import { Syringe } from 'lucide-react';

// next/link のモック
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('SectionWithForm', () => {
  const defaultProps = {
    title: 'ワクチン',
    icon: Syringe,
    showForm: false,
    onToggleForm: vi.fn(),
    membersReady: true,
    hasNoMembers: false,
    formContent: <div>フォーム内容</div>,
    children: <div>リスト内容</div>,
    addLabel: 'ワクチンを追加',
    formTitle: '新規ワクチン登録',
  };

  it('タイトルとアイコンを表示する', () => {
    render(<SectionWithForm {...defaultProps} />);
    expect(screen.getByText('ワクチン')).toBeInTheDocument();
  });

  it('リスト内容を常に表示する', () => {
    render(<SectionWithForm {...defaultProps} />);
    expect(screen.getByText('リスト内容')).toBeInTheDocument();
  });

  it('フォーム非表示時はフォーム内容を表示しない', () => {
    render(<SectionWithForm {...defaultProps} showForm={false} />);
    expect(screen.queryByText('フォーム内容')).not.toBeInTheDocument();
    expect(screen.queryByText('新規ワクチン登録')).not.toBeInTheDocument();
  });

  it('フォーム表示時にフォーム内容を表示する', () => {
    render(<SectionWithForm {...defaultProps} showForm={true} />);
    expect(screen.getByText('フォーム内容')).toBeInTheDocument();
    expect(screen.getByText('新規ワクチン登録')).toBeInTheDocument();
  });

  it('追加ボタンのクリックでonToggleFormが呼ばれる', () => {
    const onToggle = vi.fn();
    render(<SectionWithForm {...defaultProps} onToggleForm={onToggle} />);
    fireEvent.click(screen.getByLabelText('ワクチンを追加'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('フォーム表示中は閉じるボタンになる', () => {
    render(<SectionWithForm {...defaultProps} showForm={true} />);
    expect(screen.getByLabelText('閉じる')).toBeInTheDocument();
  });

  it('メンバー未登録時はフォームではなく警告を表示する', () => {
    render(<SectionWithForm {...defaultProps} showForm={true} hasNoMembers={true} />);
    expect(screen.queryByText('フォーム内容')).not.toBeInTheDocument();
    expect(screen.getByText(/メンバーページ/)).toBeInTheDocument();
    expect(screen.getByText(/メンバーを登録してください/)).toBeInTheDocument();
  });

  it('メンバー未登録警告にメンバーページへのリンクがある', () => {
    render(<SectionWithForm {...defaultProps} showForm={true} hasNoMembers={true} />);
    const link = screen.getByText('メンバーページ');
    expect(link.closest('a')).toHaveAttribute('href', '/members');
  });

  it('membersReadyがfalseの場合はフォームを表示しない', () => {
    render(<SectionWithForm {...defaultProps} showForm={true} membersReady={false} />);
    expect(screen.queryByText('フォーム内容')).not.toBeInTheDocument();
  });
});
