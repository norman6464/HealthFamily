package app.healthfamily.domain.visit;

import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

/**
 * 検査の記録。
 *
 * <p>健康診断のように次回予定を持つものがある。次回が近づいたら通知する点は
 * ワクチンと同じで、予定日を過ぎても止めない。受け忘れに気づく機会を残すため。
 */
public record Examination(
        String id,
        String userId,
        String memberId,
        String examinationType,
        LocalDate examinedAt,
        LocalDate nextScheduledDate,
        String notes)
        implements OwnedResource {

    /** この日数前から通知する */
    private static final long REMINDER_DAYS = 7;

    public Examination {
        if (id == null || id.isBlank()) {
            throw DomainException.validation("検査記録のIDは必須です");
        }
        if (memberId == null || memberId.isBlank()) {
            throw DomainException.validation("対象メンバーは必須です");
        }
        if (examinationType == null || examinationType.isBlank()) {
            throw DomainException.validation("検査の種類は必須です");
        }
        if (examinedAt == null) {
            throw DomainException.validation("検査日は必須です");
        }
        if (nextScheduledDate != null && nextScheduledDate.isBefore(examinedAt)) {
            throw DomainException.validation("次回予定日は検査日より後の日付にしてください");
        }
    }

    @Override
    public String ownerId() {
        return userId;
    }

    public Optional<Long> daysUntilNext(LocalDate today) {
        return Optional.ofNullable(nextScheduledDate).map(d -> ChronoUnit.DAYS.between(today, d));
    }

    public boolean needsReminderOn(LocalDate today) {
        return daysUntilNext(today).map(d -> d <= REMINDER_DAYS).orElse(false);
    }
}
