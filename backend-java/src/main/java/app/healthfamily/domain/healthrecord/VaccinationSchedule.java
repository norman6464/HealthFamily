package app.healthfamily.domain.healthrecord;

import app.healthfamily.domain.shared.DomainException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

/**
 * ワクチンの接種日と次回予定。
 *
 * <p>次回接種のリマインダーは 1 週間前から出す。予定日を過ぎても止めない。
 * 打ち忘れたまま通知が消えると、気づく機会がなくなるため。
 *
 * @param vaccinatedAt 接種日
 * @param nextScheduledDate 次回予定日。未設定なら null
 */
public record VaccinationSchedule(LocalDate vaccinatedAt, LocalDate nextScheduledDate) {

    /** この日数前から通知する */
    private static final long REMINDER_DAYS = 7;

    public VaccinationSchedule {
        if (vaccinatedAt != null
                && nextScheduledDate != null
                && nextScheduledDate.isBefore(vaccinatedAt)) {
            throw DomainException.validation("次回接種日は接種日より後の日付にしてください");
        }
    }

    public static VaccinationSchedule of(LocalDate vaccinatedAt, LocalDate nextScheduledDate) {
        return new VaccinationSchedule(vaccinatedAt, nextScheduledDate);
    }

    /** 次回予定日までの日数。過ぎていれば負になる。 */
    public Optional<Long> daysUntilNext(LocalDate today) {
        return Optional.ofNullable(nextScheduledDate)
                .map(next -> ChronoUnit.DAYS.between(today, next));
    }

    /** 通知すべきか。1週間前から、過ぎたあとも出し続ける。 */
    public boolean needsReminderOn(LocalDate today) {
        return daysUntilNext(today).map(days -> days <= REMINDER_DAYS).orElse(false);
    }

    /** 予定日を過ぎているか。 */
    public boolean isOverdueOn(LocalDate today) {
        return daysUntilNext(today).map(days -> days < 0).orElse(false);
    }
}
