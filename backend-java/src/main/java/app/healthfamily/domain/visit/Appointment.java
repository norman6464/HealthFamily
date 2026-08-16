package app.healthfamily.domain.visit;

import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

/**
 * 通院の予定と記録。
 *
 * <p>リマインダーは「予約日の何日前から出すか」で決まる。過ぎた予約は通知しない。
 * 済んだ予定を知らせても行動につながらないため、ワクチンとは扱いを変えている。
 */
public record Appointment(
        String id,
        String userId,
        String memberId,
        String hospitalId,
        String appointmentType,
        Instant appointmentDate,
        String description,
        String testResults,
        Double cost,
        boolean reminderEnabled,
        int reminderDaysBefore)
        implements OwnedResource {

    public Appointment {
        if (id == null || id.isBlank()) {
            throw DomainException.validation("通院記録のIDは必須です");
        }
        if (memberId == null || memberId.isBlank()) {
            throw DomainException.validation("対象メンバーは必須です");
        }
        if (appointmentDate == null) {
            throw DomainException.validation("通院日時は必須です");
        }
        if (reminderDaysBefore < 0 || reminderDaysBefore > 365) {
            throw DomainException.validation("リマインダーの事前日数は 0〜365 日で指定してください");
        }
        if (cost != null && cost < 0) {
            throw DomainException.validation("費用に負の値は指定できません");
        }
    }

    @Override
    public String ownerId() {
        return userId;
    }

    /** 通院日（アプリの基準タイムゾーンでの日付）。 */
    public LocalDate dateIn(ZoneId zone) {
        return appointmentDate.atZone(zone).toLocalDate();
    }

    /** 通院日までの日数。過ぎていれば負。 */
    public long daysUntil(LocalDate today, ZoneId zone) {
        return ChronoUnit.DAYS.between(today, dateIn(zone));
    }

    /**
     * 通知すべきか。
     *
     * <p>設定が有効で、予約日まで所定の日数以内で、まだ過ぎていないときだけ。
     */
    public boolean needsReminderOn(LocalDate today, ZoneId zone) {
        if (!reminderEnabled) {
            return false;
        }
        long days = daysUntil(today, zone);
        return days >= 0 && days <= reminderDaysBefore;
    }

    public Optional<String> hospital() {
        return Optional.ofNullable(hospitalId);
    }
}
