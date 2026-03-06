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
   * アイコン種別を取得（コンポーネント側でMemberIconに渡す用）
   */
  getIconType(): { memberType: MemberType; petType?: PetType } {
    return {
      memberType: this.member.memberType,
      petType: this.member.petType,
    };
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

  /**
   * 表示用の情報を取得
   */
  getDisplayInfo(): { memberType: MemberType; petType?: PetType; name: string; typeLabel: string } {
    return {
      memberType: this.member.memberType,
      petType: this.member.petType,
      name: this.member.name,
      typeLabel: MemberEntity.getMemberTypeLabel(this.member.memberType),
    };
  }

  /**
   * メンバー種別に応じたlucide-reactアイコン名を返す
   */
  static getMemberIcon(memberType: MemberType, petType?: PetType): string {
    if (memberType === 'human') return 'User';
    const petIcons: Record<string, string> = {
      dog: 'Dog',
      cat: 'Cat',
      rabbit: 'Rabbit',
      bird: 'Bird',
    };
    return petIcons[petType ?? ''] ?? 'PawPrint';
  }

  /**
   * メンバー名のバリデーション
   */
  static validateName(name: string): { valid: boolean; error?: string } {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: '名前を入力してください' };
    }
    if (trimmed.length > 20) {
      return { valid: false, error: '名前は20文字以内で入力してください' };
    }
    return { valid: true };
  }

  /**
   * メンバー名のサニタイズ（トリム・連続空白正規化）
   */
  static sanitizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  /**
   * 名前の頭文字を取得（アバター表示用）
   */
  static getNameInitial(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length === 0) return '?';
    return trimmed[0].toUpperCase();
  }

  /**
   * 生年月日から年齢を計算する（staticバージョン）
   */
  static calculateAge(birthDate: Date | null | undefined, today: Date): number | null {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  private static readonly memberTypeLabels: Record<MemberType, string> = {
    human: '家族',
    pet: 'ペット',
  };

  /**
   * メンバータイプの日本語ラベルを返す
   */
  static getMemberTypeLabel(type: MemberType): string {
    return MemberEntity.memberTypeLabels[type];
  }

  private static readonly petTypeLabels: Record<PetType, string> = {
    dog: '犬',
    cat: '猫',
    rabbit: 'うさぎ',
    bird: '鳥',
    other: 'その他',
  };

  /**
   * ペットタイプの日本語ラベルを返す
   */
  static getPetTypeLabel(type: PetType | undefined): string {
    if (!type) return '';
    return MemberEntity.petTypeLabels[type];
  }

  /**
   * 年齢からグループを判定する
   */
  static getAgeGroup(age: number | null): 'infant' | 'child' | 'adult' | 'senior' | 'unknown' {
    if (age === null) return 'unknown';
    if (age < 6) return 'infant';
    if (age < 18) return 'child';
    if (age < 65) return 'adult';
    return 'senior';
  }

  private static readonly ageGroupLabels: Record<string, string> = {
    infant: '乳幼児',
    child: '子供',
    adult: '大人',
    senior: 'シニア',
    unknown: '不明',
  };

  /**
   * 年齢グループの日本語ラベルを返す
   */
  static getAgeGroupLabel(group: 'infant' | 'child' | 'adult' | 'senior' | 'unknown'): string {
    return MemberEntity.ageGroupLabels[group];
  }

  /**
   * 年齢の表示用ラベルを返す
   */
  static getAgeDisplayLabel(age: number | null): string {
    if (age === null) return '年齢不明';
    return `${age}歳`;
  }

  /**
   * 生年月日のバリデーション
   */
  static validateBirthDate(
    birthDate: Date | null,
    today: Date,
  ): { valid: boolean; error?: string } {
    if (birthDate === null) return { valid: true };
    if (birthDate.getTime() > today.getTime()) {
      return { valid: false, error: '生年月日は今日以前の日付を入力してください' };
    }
    return { valid: true };
  }

  /**
   * プロフィール要約テキストを返す
   */
  static getProfileSummary(
    memberType: MemberType,
    age: number | null,
    petType?: PetType,
  ): string {
    const typeLabel = MemberEntity.getMemberTypeLabel(memberType);
    const petLabel = petType ? MemberEntity.getPetTypeLabel(petType) : '';
    const ageLabel = age !== null ? ` (${age}歳)` : '';

    if (memberType === 'pet' && petLabel) {
      return `${typeLabel} - ${petLabel}${ageLabel}`;
    }
    return `${typeLabel}${ageLabel}`;
  }
}
