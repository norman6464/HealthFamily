package app.healthfamily.domain.healthrecord;

import app.healthfamily.domain.shared.DomainException;
import java.util.Optional;

/**
 * 体重と身長の記録。
 *
 * <p>どちらか一方だけの記録もありうる（体重だけ毎日測る等）が、両方無い記録は意味がない。
 *
 * @param weightKg 体重(kg)。未測定なら null
 * @param heightCm 身長(cm)。未測定なら null
 */
public record BodyMeasurement(Double weightKg, Double heightCm) {

    private static final double MAX_WEIGHT_KG = 1000.0;
    private static final double MAX_HEIGHT_CM = 300.0;

    public BodyMeasurement {
        if (weightKg == null && heightCm == null) {
            throw DomainException.validation("体重か身長のどちらかは入力してください");
        }
        if (weightKg != null && (weightKg <= 0 || weightKg > MAX_WEIGHT_KG)) {
            throw DomainException.validation("体重の値が正しくありません");
        }
        if (heightCm != null && (heightCm <= 0 || heightCm > MAX_HEIGHT_CM)) {
            throw DomainException.validation("身長の値が正しくありません");
        }
    }

    public static BodyMeasurement of(Double weightKg, Double heightCm) {
        return new BodyMeasurement(weightKg, heightCm);
    }

    /** BMI。両方そろっているときだけ算出する。小数第1位に丸める。 */
    public Optional<Double> bmi() {
        if (weightKg == null || heightCm == null) {
            return Optional.empty();
        }
        double meters = heightCm / 100.0;
        return Optional.of(Math.round(weightKg / (meters * meters) * 10.0) / 10.0);
    }

    public Optional<Double> weight() {
        return Optional.ofNullable(weightKg);
    }

    public Optional<Double> height() {
        return Optional.ofNullable(heightCm);
    }
}
