import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StockAlertList } from '@/components/dashboard/StockAlertList';

describe('StockAlertList', () => {
  const alerts = [
    {
      medicationId: 'm1',
      medicationName: 'アスピリン',
      memberId: 'mem1',
      memberName: '太郎',
      stockQuantity: 5,
      stockAlertDate: '2026-03-05T00:00:00.000Z',
      daysUntilAlert: 5,
      isOverdue: false,
    },
    {
      medicationId: 'm2',
      medicationName: 'ビタミンC',
      memberId: 'mem2',
      memberName: '花子',
      stockQuantity: 0,
      stockAlertDate: '2026-02-25T00:00:00.000Z',
      daysUntilAlert: -3,
      isOverdue: true,
    },
  ];

  it('ローディング中は何も表示しない', () => {
    const { container } = render(<StockAlertList alerts={[]} isLoading={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('アラートが空の場合は何も表示しない', () => {
    const { container } = render(<StockAlertList alerts={[]} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('アラート一覧を表示する', () => {
    render(<StockAlertList alerts={alerts} isLoading={false} />);
    expect(screen.getByText('在庫アラート')).toBeInTheDocument();
    expect(screen.getByText('アスピリン')).toBeInTheDocument();
    expect(screen.getByText('ビタミンC')).toBeInTheDocument();
  });

  it('メンバー名を表示する', () => {
    render(<StockAlertList alerts={alerts} isLoading={false} />);
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText('花子')).toBeInTheDocument();
  });

  it('残り日数を表示する', () => {
    render(<StockAlertList alerts={alerts} isLoading={false} />);
    expect(screen.getByText('残り5日分')).toBeInTheDocument();
    expect(screen.getByText('あと5日')).toBeInTheDocument();
  });

  it('期限超過のアラートには期限超過を表示する', () => {
    render(<StockAlertList alerts={alerts} isLoading={false} />);
    expect(screen.getByText('期限超過')).toBeInTheDocument();
  });
});
