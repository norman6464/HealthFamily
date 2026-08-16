package app.healthfamily.domain.healthrecord;

import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;
import java.time.Instant;
import java.util.List;

/**
 * 体調の記録。
 *
 * <p>体調は 1〜5 の段階で表す。範囲外を弾くのは、後から推移をグラフにするときに
 * 目盛りが壊れるため。
 *
 * @param conditionLevel 1(悪い)〜5(良い)
 */
public record HealthLog(
        String id,
        String userId,
        String memberId,
        int conditionLevel,
        List<String> symptoms,
        String notes,
        Instant recordedAt)
        implements OwnedResource {

    private static final int MIN_LEVEL = 1;
    private static final int MAX_LEVEL = 5;

    public HealthLog {
        if (id == null || id.isBlank()) {
            throw DomainException.validation("体調記録のIDは必須です");
        }
        if (memberId == null || memberId.isBlank()) {
            throw DomainException.validation("対象メンバーは必須です");
        }
        if (conditionLevel < MIN_LEVEL || conditionLevel > MAX_LEVEL) {
            throw DomainException.validation(
                    "体調は %d〜%d の範囲で指定してください".formatted(MIN_LEVEL, MAX_LEVEL));
        }
        symptoms = symptoms == null ? List.of() : List.copyOf(symptoms);
    }

    @Override
    public String ownerId() {
        return userId;
    }

    /** 記録として注意を要するか。体調が悪い、または症状が記録されている。 */
    public boolean needsAttention() {
        return conditionLevel <= 2 || !symptoms.isEmpty();
    }
}
