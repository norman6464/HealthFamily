package app.healthfamily.domain.healthrecord;

import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;
import java.time.Instant;
import java.util.Optional;

/** 体格の記録。値の妥当性と BMI は {@link BodyMeasurement} が持つ。 */
public record BodyMeasurementRecord(
        String id,
        String userId,
        String memberId,
        BodyMeasurement measurement,
        Instant recordedAt,
        String notes)
        implements OwnedResource {

    public BodyMeasurementRecord {
        if (id == null || id.isBlank()) {
            throw DomainException.validation("記録のIDは必須です");
        }
        if (memberId == null || memberId.isBlank()) {
            throw DomainException.validation("対象メンバーは必須です");
        }
        if (measurement == null) {
            throw DomainException.validation("体重か身長のどちらかは入力してください");
        }
        if (recordedAt == null) {
            throw DomainException.validation("記録日時は必須です");
        }
    }

    @Override
    public String ownerId() {
        return userId;
    }

    public Optional<Double> bmi() {
        return measurement.bmi();
    }
}
