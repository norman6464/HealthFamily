package app.healthfamily.domain.healthrecord;

import app.healthfamily.domain.shared.DomainException;

/**
 * 体温。
 *
 * <p>人体としてありえない値をコンストラクタで弾く。入力ミス（36.5 のつもりで 365）が
 * そのまま記録され、後から見返したときにグラフが壊れるのを防ぐ。
 */
public record BodyTemperature(double value) {

    /** 生存しうる下限。これを下回る記録は入力ミスとみなす */
    private static final double MIN = 30.0;

    /** 生存しうる上限 */
    private static final double MAX = 45.0;

    public BodyTemperature {
        if (Double.isNaN(value) || value < MIN || value > MAX) {
            throw DomainException.validation(
                    "体温は %.1f〜%.1f 度の範囲で入力してください".formatted(MIN, MAX));
        }
        // 測定器の精度以上の桁は持たない
        value = Math.round(value * 10.0) / 10.0;
    }

    public static BodyTemperature of(double value) {
        return new BodyTemperature(value);
    }

    public FeverLevel level() {
        if (value >= 38.0) {
            return FeverLevel.FEVER;
        }
        if (value >= 37.5) {
            return FeverLevel.SLIGHT_FEVER;
        }
        if (value >= 36.0) {
            return FeverLevel.NORMAL;
        }
        return FeverLevel.LOW;
    }
}
