import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GreetingCard } from '@/components/dashboard/GreetingCard';

vi.mock('@/stores/characterStore', () => ({
  useCharacterStore: () => ({
    getConfig: () => ({ type: 'cat', name: 'ねこ' }),
  }),
}));

vi.mock('@/components/shared/CharacterIcon', () => ({
  CharacterIcon: ({ type }: { type: string }) => <span data-testid="char-icon">{type}</span>,
}));

describe('GreetingCard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('朝の時間帯で「おはよう」を表示する', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 1, 7, 0, 0));
    render(<GreetingCard displayName="太郎" />);
    expect(screen.getByText(/おはよう/)).toBeInTheDocument();
  });

  it('昼の時間帯で「こんにちは」を表示する', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 1, 13, 0, 0));
    render(<GreetingCard displayName="太郎" />);
    expect(screen.getByText(/こんにちは/)).toBeInTheDocument();
  });

  it('夜の時間帯で「こんばんは」を表示する', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 1, 20, 0, 0));
    render(<GreetingCard displayName="太郎" />);
    expect(screen.getByText(/こんばんは/)).toBeInTheDocument();
  });

  it('ユーザー名を表示する', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 1, 10, 0, 0));
    render(<GreetingCard displayName="花子" />);
    expect(screen.getByText(/花子/)).toBeInTheDocument();
  });

  it('キャラクターアイコンを表示する', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 1, 10, 0, 0));
    render(<GreetingCard displayName="太郎" />);
    expect(screen.getByTestId('char-icon')).toBeInTheDocument();
  });
});
