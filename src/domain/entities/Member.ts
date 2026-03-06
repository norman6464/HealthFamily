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

  /**
   * ペットの年齢を人間年齢に換算する（犬・猫のみ対応）
   */
  static getHumanEquivalentAge(petAge: number | null, petType: PetType): number | null {
    if (petAge === null) return null;
    if (petType !== 'dog' && petType !== 'cat') return null;
    if (petAge <= 0) return 0;
    if (petAge === 1) return 15;
    if (petAge === 2) return 24;
    return 24 + (petAge - 2) * 4;
  }

  /**
   * ペットの年齢表示ラベルを返す
   */
  static getPetAgeLabel(age: number | null, petType: PetType): string {
    if (age === null) return '年齢不明';
    const humanAge = MemberEntity.getHumanEquivalentAge(age, petType);
    if (humanAge === null) return `${age}歳`;
    return `${age}歳 (人間換算: 約${humanAge}歳)`;
  }

  /**
   * ペットのライフステージを判定する
   */
  static getPetLifeStage(age: number | null, petType: PetType): string {
    if (age === null) return '不明';
    if (petType === 'dog') {
      if (age < 1) return '子犬';
      if (age < 7) return '成犬';
      return 'シニア犬';
    }
    if (petType === 'cat') {
      if (age < 1) return '子猫';
      if (age < 7) return '成猫';
      return 'シニア猫';
    }
    return 'ペット';
  }

  /**
   * プロフィールの完成度(0-100%)を算出する
   */
  static getProfileCompleteness(member: {
    name: string;
    memberType: string;
    birthDate?: Date | null;
    photoUrl?: string | null;
    notes?: string | null;
    petType?: string | null;
  }): number {
    const fields = [
      !!member.name,
      !!member.memberType,
      !!member.birthDate,
      !!member.photoUrl,
      !!member.notes,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }

  /**
   * 未入力フィールドのリストを返す
   */
  static getMissingFields(member: {
    name: string;
    memberType: string;
    birthDate?: Date | null;
    photoUrl?: string | null;
    notes?: string | null;
  }): string[] {
    const missing: string[] = [];
    if (!member.birthDate) missing.push('生年月日');
    if (!member.photoUrl) missing.push('写真');
    if (!member.notes) missing.push('メモ');
    return missing;
  }

  /**
   * 完成度に応じたラベルを返す
   */
  static getProfileCompletenessLabel(percentage: number): string {
    if (percentage >= 100) return '完了';
    if (percentage >= 80) return 'ほぼ完了';
    if (percentage >= 50) return '半分入力済み';
    return '入力が必要';
  }

  private static readonly ageMilestones: Record<number, string> = {
    0: '誕生',
    1: '1歳',
    20: '成人',
    65: '高齢者',
    75: '後期高齢者',
  };

  /**
   * 年齢に応じたマイルストーンを返す
   */
  static getAgeMilestone(age: number): string | null {
    return MemberEntity.ageMilestones[age] ?? null;
  }

  /**
   * 誕生日が指定日数以内かどうかを判定する
   */
  static isUpcomingBirthday(birthDate: Date, today: Date, withinDays: number): boolean {
    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    const diffTime = thisYearBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= withinDays;
  }

  /**
   * 誕生日までのカウントダウンテキストを返す
   */
  static getBirthdayCountdown(birthDate: Date, today: Date): string {
    const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday.getTime() < todayNorm.getTime()) {
      nextBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
    }
    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '今日が誕生日です';
    return `誕生日まであと${diffDays}日`;
  }

  /**
   * 服薬遵守率・体調・通院状況からヘルススコアを算出する(0-100)
   */
  static calculateHealthScore(params: {
    adherenceRate: number;
    averageCondition: number;
    appointmentComplianceRate: number;
  }): number {
    const adherenceScore = params.adherenceRate * 0.5;
    const conditionScore = ((params.averageCondition - 1) / 4) * 100 * 0.3;
    const appointmentScore = params.appointmentComplianceRate * 0.2;
    return Math.round(adherenceScore + conditionScore + appointmentScore);
  }

  /**
   * ヘルススコアに応じたラベルを返す
   */
  static getHealthScoreLabel(score: number): string {
    if (score >= 90) return '優良';
    if (score >= 70) return '良好';
    if (score >= 50) return '普通';
    return '要改善';
  }

  /**
   * ヘルススコアに応じたカラークラスを返す
   */
  static getHealthScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  }
}
