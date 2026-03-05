import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MissedDoseIndicator } from '@/components/dashboard/MissedDoseIndicator';

describe('MissedDoseIndicator', () => {
  it('overdueLevel=noneの場合は何も表示しない', () => {
    const { container } = render(
      <MissedDoseIndicator overdueLevel="none" overdueMinutes={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('warningの場合は経過時間を表示する', () => {
    render(<MissedDoseIndicator overdueLevel="warning" overdueMinutes={35} />);
    expect(screen.getByText('35分経過')).toBeInTheDocument();
  });

  it('dangerの場合は経過時間を表示する', () => {
    render(<MissedDoseIndicator overdueLevel="danger" overdueMinutes={90} />);
    expect(screen.getByText('1時間30分経過')).toBeInTheDocument();
  });

  it('ちょうど1時間の場合', () => {
    render(<MissedDoseIndicator overdueLevel="danger" overdueMinutes={60} />);
    expect(screen.getByText('1時間経過')).toBeInTheDocument();
  });

  it('warningスタイルが適用される', () => {
    const { container } = render(
      <MissedDoseIndicator overdueLevel="warning" overdueMinutes={40} />
    );
    expect(container.querySelector('.text-orange-600')).not.toBeNull();
  });

  it('dangerスタイルが適用される', () => {
    const { container } = render(
      <MissedDoseIndicator overdueLevel="danger" overdueMinutes={120} />
    );
    expect(container.querySelector('.text-red-600')).not.toBeNull();
  });
});
