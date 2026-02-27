import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterSelector } from '../CharacterSelector';
import { useCharacterStore } from '../../../stores/characterStore';

describe('CharacterSelector', () => {
  beforeEach(() => {
    useCharacterStore.setState({ selectedCharacter: 'cat' });
  });

  it('4種類のキャラクターが表示される', () => {
    render(<CharacterSelector />);

    expect(screen.getByText('いぬ')).toBeInTheDocument();
    expect(screen.getByText('ねこ')).toBeInTheDocument();
    expect(screen.getByText('うさぎ')).toBeInTheDocument();
    expect(screen.getByText('インコ')).toBeInTheDocument();
  });

  it('各キャラクターのアイコンが表示される', () => {
    render(<CharacterSelector />);

    // lucide-reactアイコンが4つ表示されていることを確認
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('キャラクターをクリックして選択できる', () => {
    render(<CharacterSelector />);

    fireEvent.click(screen.getByText('いぬ'));

    expect(useCharacterStore.getState().selectedCharacter).toBe('dog');
  });

  it('選択中のキャラクターが視覚的に強調される', () => {
    render(<CharacterSelector />);

    // 初期状態ではcatが選択されている
    const catButton = screen.getByText('ねこ').closest('button');
    expect(catButton?.className).toContain('ring-2');
  });
});
