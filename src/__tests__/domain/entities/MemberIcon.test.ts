import { describe, it, expect } from 'vitest';
import { MemberEntity } from '@/domain/entities/Member';

describe('MemberEntity getMemberIcon', () => {
  it('人間メンバーはUserアイコン', () => {
    expect(MemberEntity.getMemberIcon('human')).toBe('User');
  });

  it('犬はDogアイコン', () => {
    expect(MemberEntity.getMemberIcon('pet', 'dog')).toBe('Dog');
  });

  it('猫はCatアイコン', () => {
    expect(MemberEntity.getMemberIcon('pet', 'cat')).toBe('Cat');
  });

  it('うさぎはRabbitアイコン', () => {
    expect(MemberEntity.getMemberIcon('pet', 'rabbit')).toBe('Rabbit');
  });

  it('鳥はBirdアイコン', () => {
    expect(MemberEntity.getMemberIcon('pet', 'bird')).toBe('Bird');
  });

  it('その他ペットはPawPrintアイコン', () => {
    expect(MemberEntity.getMemberIcon('pet', 'other')).toBe('PawPrint');
  });

  it('ペットでpetType未指定はPawPrintアイコン', () => {
    expect(MemberEntity.getMemberIcon('pet')).toBe('PawPrint');
  });
});
