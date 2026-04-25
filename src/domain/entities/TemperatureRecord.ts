/**
 * 体温記録エンティティ
 */

export interface TemperatureRecord {
  readonly id: string;
  readonly userId: string;
  readonly memberId: string;
  readonly memberName?: string;
  readonly temperature: number;
  readonly measuredAt: Date;
  readonly notes?: string;
  readonly createdAt: Date;
}

export type TemperatureCategory = 'hypothermia' | 'normal' | 'low_fever' | 'fever' | 'high_fever';

export class TemperatureRecordEntity {
  private static readonly TEMP_HYPOTHERMIA = 35.0;
  private static readonly TEMP_LOW_FEVER = 37.5;
  private static readonly TEMP_FEVER = 38.0;
  private static readonly TEMP_HIGH_FEVER = 39.0;
  private static readonly TEMP_MIN_VALID = 30.0;
  private static readonly TEMP_MAX_VALID = 45.0;

  private static readonly CATEGORY_LABELS: Record<TemperatureCategory, string> = {
    hypothermia: '低体温',
    normal: '平熱',
    low_fever: '微熱',
    fever: '発熱',
    high_fever: '高熱',
  };

  private static readonly CATEGORY_COLORS: Record<TemperatureCategory, string> = {
    hypothermia: 'text-blue-600',
    normal: 'text-green-600',
    low_fever: 'text-yellow-600',
    fever: 'text-orange-600',
    high_fever: 'text-red-600',
  };

  static classify(temperature: number): TemperatureCategory {
    if (temperature < TemperatureRecordEntity.TEMP_HYPOTHERMIA) return 'hypothermia';
    if (temperature < TemperatureRecordEntity.TEMP_LOW_FEVER) return 'normal';
    if (temperature < TemperatureRecordEntity.TEMP_FEVER) return 'low_fever';
    if (temperature < TemperatureRecordEntity.TEMP_HIGH_FEVER) return 'fever';
    return 'high_fever';
  }

  static getCategoryLabel(category: TemperatureCategory): string {
    return TemperatureRecordEntity.CATEGORY_LABELS[category];
  }

  static getCategoryColor(category: TemperatureCategory): string {
    return TemperatureRecordEntity.CATEGORY_COLORS[category];
  }

  static isValidTemperature(temperature: number): boolean {
    return (
      Number.isFinite(temperature) &&
      temperature >= TemperatureRecordEntity.TEMP_MIN_VALID &&
      temperature <= TemperatureRecordEntity.TEMP_MAX_VALID
    );
  }
}
