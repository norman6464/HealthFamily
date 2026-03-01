import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdherenceStatsCard } from '@/components/dashboard/AdherenceStatsCard';

describe('AdherenceStatsCard', () => {
  const stats = {
    overall: { weeklyRate: 85, monthlyRate: 72, weeklyCount: 12, monthlyCount: 45 },
    members: [
      { memberId: 'm1', memberName: '太郎', weeklyRate: 90, monthlyRate: 80, weeklyCount: 6, monthlyCount: 25 },
      { memberId: 'm2', memberName: '花子', weeklyRate: 60, monthlyRate: 55, weeklyCount: 6, monthlyCount: 20 },
    ],
  };

  it('ローディング中は何も表示しない', () => {
    const { container } = render(<AdherenceStatsCard stats={null} isLoading={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('statsがnullの場合は何も表示しない', () => {
    const { container } = render(<AdherenceStatsCard stats={null} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('週間・月間のアドヒアランス率を表示する', () => {
    render(<AdherenceStatsCard stats={stats} isLoading={false} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('レベルラベルを表示する', () => {
    render(<AdherenceStatsCard stats={stats} isLoading={false} />);
    const labels = screen.getAllByText('良好'); // 85% and 72% are both 良好
    expect(labels.length).toBe(2);
  });

  it('メンバー別の統計を表示する', () => {
    render(<AdherenceStatsCard stats={stats} isLoading={false} />);
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText('花子')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('メンバーがいない場合はメンバー別セクションを表示しない', () => {
    const noMemberStats = { ...stats, members: [] };
    render(<AdherenceStatsCard stats={noMemberStats} isLoading={false} />);
    expect(screen.queryByText('メンバー別')).not.toBeInTheDocument();
  });
});
