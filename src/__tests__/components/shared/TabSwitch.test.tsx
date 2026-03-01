import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabSwitch } from '@/components/shared/TabSwitch';

describe('TabSwitch', () => {
  const tabs = [
    { id: 'upcoming', label: '今後の予定', count: 3 },
    { id: 'past', label: '過去の予定', count: 5 },
  ];

  it('全てのタブを表示する', () => {
    render(<TabSwitch tabs={tabs} activeTab="upcoming" onTabChange={vi.fn()} />);
    expect(screen.getByText('今後の予定')).toBeInTheDocument();
    expect(screen.getByText('過去の予定')).toBeInTheDocument();
  });

  it('カウントを表示する', () => {
    render(<TabSwitch tabs={tabs} activeTab="upcoming" onTabChange={vi.fn()} />);
    expect(screen.getByText('(3)')).toBeInTheDocument();
    expect(screen.getByText('(5)')).toBeInTheDocument();
  });

  it('アクティブタブにaria-selected=trueが設定される', () => {
    render(<TabSwitch tabs={tabs} activeTab="upcoming" onTabChange={vi.fn()} />);
    expect(screen.getByText('今後の予定').closest('button')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('過去の予定').closest('button')).toHaveAttribute('aria-selected', 'false');
  });

  it('タブクリックでonTabChangeが呼ばれる', () => {
    const onTabChange = vi.fn();
    render(<TabSwitch tabs={tabs} activeTab="upcoming" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText('過去の予定'));
    expect(onTabChange).toHaveBeenCalledWith('past');
  });

  it('カウントなしのタブも表示できる', () => {
    const simpleTabs = [
      { id: 'a', label: 'タブA' },
      { id: 'b', label: 'タブB' },
    ];
    render(<TabSwitch tabs={simpleTabs} activeTab="a" onTabChange={vi.fn()} />);
    expect(screen.getByText('タブA')).toBeInTheDocument();
    expect(screen.queryByText('(')).not.toBeInTheDocument();
  });
});
