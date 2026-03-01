import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationToast } from '@/components/shared/NotificationToast';

describe('NotificationToast', () => {
  it('メッセージを表示する', () => {
    render(<NotificationToast message="保存しました" type="success" />);
    expect(screen.getByText('保存しました')).toBeInTheDocument();
  });

  it('エラータイプのスタイルが適用される', () => {
    const { container } = render(<NotificationToast message="エラー" type="error" />);
    const el = container.querySelector('[class*="red"]');
    expect(el).toBeInTheDocument();
  });

  it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
    const onClose = vi.fn();
    render(<NotificationToast message="テスト" type="success" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('閉じる'));
    expect(onClose).toHaveBeenCalled();
  });

  it('successタイプのスタイルが適用される', () => {
    const { container } = render(<NotificationToast message="成功" type="success" />);
    const el = container.querySelector('[class*="green"]');
    expect(el).toBeInTheDocument();
  });

  it('onCloseが未指定の場合は閉じるボタンが表示されない', () => {
    render(<NotificationToast message="テスト" type="info" />);
    expect(screen.queryByLabelText('閉じる')).not.toBeInTheDocument();
  });
});
