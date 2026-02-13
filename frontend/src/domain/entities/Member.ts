/**
 * メンバー（家族・ペット）エンティティ
 */

export type MemberType = 'human' | 'pet';
export type PetType = 'dog' | 'cat' | 'rabbit' | 'bird' | 'other';

export interface Member {
  readonly id: string;
  readonly userId: string;
  readonly memberType: MemberType;
  readonly name: string;
  readonly petType?: PetType;
  readonly photoUrl?: string;
  readonly birthDate?: Date;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * メンバーのビジネスロジック
 */
export class MemberEntity {
  constructor(private readonly member: Member) {}

  /**
   * ペットかどうか
   */
  isPet(): boolean {
    return this.member.memberType === 'pet';
  }

  /**
   * 人間かどうか
   */
  isHuman(): boolean {
    return this.member.memberType === 'human';
  }

  /**
   * 年齢を計算
   */
  getAge(): number | null {
    if (!this.member.birthDate) {
      return null;
    }

    const today = new Date();
    const birthDate = new Date(this.member.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * 表示用のアイコン絵文字を取得
   */
  getIcon(): string {
    if (this.isPet()) {
      const iconMap: Record<PetType, string> = {
        dog: '🐕',
        cat: '🐈',
        rabbit: '🐇',
        bird: '🦜',
        other: '🐾',
      };
      return iconMap[this.member.petType || 'other'];
    }

    return '👤';
  }

  get id(): string {
    return this.member.id;
  }

  get name(): string {
    return this.member.name;
  }

  get data(): Member {
    return this.member;
  }
}
