import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemberSummaryCard } from '@/components/members/MemberSummaryCard';
import { MemberSummary } from '@/domain/entities/MemberSummary';

const createSummary = (overrides: Partial<MemberSummary> = {}): MemberSummary => ({
  memberId: 'member-1',
  memberName: '太郎',
  memberType: 'human',
  medicationCount: 3,
  nextAppointmentDate: null,
  ...overrides,
});

describe('MemberSummaryCard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('薬の種類数を表示する', () => {
    render(<MemberSummaryCard summary={createSummary({ medicationCount: 5 })} />);
    expect(screen.getByText('5種類')).toBeInTheDocument();
  });

  it('予約がない場合は次回通院を表示しない', () => {
    render(<MemberSummaryCard summary={createSummary()} />);
    expect(screen.queryByText(/次回通院/)).not.toBeInTheDocument();
  });

  it('予約がある場合は次回通院を表示する', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T10:00:00Z'));
    render(<MemberSummaryCard summary={createSummary({ nextAppointmentDate: '2026-03-05T00:00:00Z' })} />);
    expect(screen.getByText('次回通院: 4日後')).toBeInTheDocument();
  });

  it('薬が0種類の場合も表示する', () => {
    render(<MemberSummaryCard summary={createSummary({ medicationCount: 0 })} />);
    expect(screen.getByText('0種類')).toBeInTheDocument();
  });
});
