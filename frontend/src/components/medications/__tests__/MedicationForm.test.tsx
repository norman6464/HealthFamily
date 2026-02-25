import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MedicationForm } from '../MedicationForm';

describe('MedicationForm', () => {
  it('フォームが正しく表示される', () => {
    render(<MedicationForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('薬の名前')).toBeInTheDocument();
    expect(screen.getByLabelText('カテゴリ')).toBeInTheDocument();
    expect(screen.getByLabelText('用量')).toBeInTheDocument();
    expect(screen.getByLabelText('頻度')).toBeInTheDocument();
    expect(screen.getByLabelText('在庫数')).toBeInTheDocument();
    expect(screen.getByLabelText('在庫警告')).toBeInTheDocument();
    expect(screen.getByLabelText('服用方法')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '追加する' })).toBeInTheDocument();
  });

  it('カテゴリの選択肢が全て表示される', () => {
    render(<MedicationForm onSubmit={vi.fn()} />);

    const select = screen.getByLabelText('カテゴリ');
    expect(select).toHaveValue('regular');

    const options = select.querySelectorAll('option');
    expect(options.length).toBe(5);
    expect(options[0].textContent).toBe('常用薬');
    expect(options[1].textContent).toBe('サプリメント');
    expect(options[2].textContent).toBe('頓服薬');
    expect(options[3].textContent).toBe('ノミ・ダニ薬');
    expect(options[4].textContent).toBe('フィラリア薬');
  });

  it('フォーム送信時にonSubmitが呼ばれる', () => {
    const onSubmit = vi.fn();
    render(<MedicationForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('薬の名前'), { target: { value: 'テスト薬' } });
    fireEvent.change(screen.getByLabelText('用量'), { target: { value: '1錠' } });
    fireEvent.change(screen.getByLabelText('頻度'), { target: { value: '1日1回' } });
    fireEvent.click(screen.getByRole('button', { name: '追加する' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'テスト薬',
      category: 'regular',
      dosage: '1錠',
      frequency: '1日1回',
    });
  });

  it('名前が空の場合、送信されない', () => {
    const onSubmit = vi.fn();
    render(<MedicationForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: '追加する' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('在庫数と在庫警告が送信データに含まれる', () => {
    const onSubmit = vi.fn();
    render(<MedicationForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('薬の名前'), { target: { value: '血圧の薬' } });
    fireEvent.change(screen.getByLabelText('在庫数'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('在庫警告'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: '追加する' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '血圧の薬',
        stockQuantity: 30,
        lowStockThreshold: 5,
      })
    );
  });

  it('送信後にフォームがリセットされる', () => {
    render(<MedicationForm onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('薬の名前'), { target: { value: 'テスト薬' } });
    fireEvent.change(screen.getByLabelText('用量'), { target: { value: '1錠' } });
    fireEvent.click(screen.getByRole('button', { name: '追加する' }));

    expect(screen.getByLabelText('薬の名前')).toHaveValue('');
    expect(screen.getByLabelText('用量')).toHaveValue('');
    expect(screen.getByLabelText('カテゴリ')).toHaveValue('regular');
  });
});
