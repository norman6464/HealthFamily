import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemberForm } from '../MemberForm';

describe('MemberForm', () => {
  it('フォームが正しく表示される', () => {
    render(<MemberForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('名前')).toBeInTheDocument();
    expect(screen.getByLabelText('タイプ')).toBeInTheDocument();
    expect(screen.getByLabelText('生年月日')).toBeInTheDocument();
    expect(screen.getByLabelText('メモ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '追加する' })).toBeInTheDocument();
  });

  it('ペットを選択するとペットタイプが表示される', () => {
    render(<MemberForm onSubmit={vi.fn()} />);

    const typeSelect = screen.getByLabelText('タイプ');
    fireEvent.change(typeSelect, { target: { value: 'pet' } });

    expect(screen.getByLabelText('ペットの種類')).toBeInTheDocument();
  });

  it('家族を選択するとペットタイプが表示されない', () => {
    render(<MemberForm onSubmit={vi.fn()} />);

    const typeSelect = screen.getByLabelText('タイプ');
    fireEvent.change(typeSelect, { target: { value: 'human' } });

    expect(screen.queryByLabelText('ペットの種類')).not.toBeInTheDocument();
  });

  it('フォーム送信時にonSubmitが呼ばれる', () => {
    const onSubmit = vi.fn();
    render(<MemberForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('名前'), { target: { value: 'テスト太郎' } });
    fireEvent.change(screen.getByLabelText('タイプ'), { target: { value: 'human' } });

    fireEvent.click(screen.getByRole('button', { name: '追加する' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'テスト太郎',
        memberType: 'human',
      })
    );
  });

  it('名前が空の場合、送信されない', () => {
    const onSubmit = vi.fn();
    render(<MemberForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: '追加する' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('ペットの場合、ペットタイプが送信データに含まれる', () => {
    const onSubmit = vi.fn();
    render(<MemberForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('名前'), { target: { value: 'ポチ' } });
    fireEvent.change(screen.getByLabelText('タイプ'), { target: { value: 'pet' } });
    fireEvent.change(screen.getByLabelText('ペットの種類'), { target: { value: 'dog' } });

    fireEvent.click(screen.getByRole('button', { name: '追加する' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ポチ',
        memberType: 'pet',
        petType: 'dog',
      })
    );
  });
});
