package app.healthfamily.domain.healthrecord;

import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;
import java.time.Instant;

/**
 * 体温の記録。
 *
 * <p>値の妥当性は {@link BodyTemperature} が持つ。ここは記録としての枠を担う。
 */
public record TemperatureRecord(
        String id,
        String userId,
        String memberId,
        BodyTemperature temperature,
        Instant measuredAt,
        String notes)
        implements OwnedResource {

    public TemperatureRecord {
        if (id == null || id.isBlank()) {
            throw DomainException.validation("記録のIDは必須です");
        }
        if (memberId == null || memberId.isBlank()) {
            throw DomainException.validation("対象メンバーは必須です");
        }
        if (temperature == null) {
            throw DomainException.validation("体温は必須です");
        }
        if (measuredAt == null) {
            throw DomainException.validation("測定日時は必須です");
        }
    }

    @Override
    public String ownerId() {
        return userId;
    }

    public FeverLevel feverLevel() {
        return temperature.level();
    }
}
