import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterSelector } from '@/components/character/CharacterSelector';
import { useCharacterStore } from '@/stores/characterStore';

describe('CharacterSelector', () => {
  beforeEach(() => {
    useCharacterStore.setState({ selectedCharacter: 'cat' });
  });

  it('全キャラクターオプションが表示される', () => {
    render(<CharacterSelector />);
    expect(screen.getByText('いぬ')).toBeInTheDocument();
    expect(screen.getByText('ねこ')).toBeInTheDocument();
    expect(screen.getByText('うさぎ')).toBeInTheDocument();
    expect(screen.getByText('インコ')).toBeInTheDocument();
  });

  it('選択中のキャラクターがハイライトされる', () => {
    render(<CharacterSelector />);
    const catButton = screen.getByText('ねこ').closest('button');
    expect(catButton?.className).toContain('border-blue-500');
  });

  it('キャラクターをクリックすると選択が変更される', () => {
    render(<CharacterSelector />);
    fireEvent.click(screen.getByText('いぬ'));
    expect(useCharacterStore.getState().selectedCharacter).toBe('dog');
  });

  it('SVGアイコンが4つ表示される', () => {
    const { container } = render(<CharacterSelector />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(4);
  });
});
