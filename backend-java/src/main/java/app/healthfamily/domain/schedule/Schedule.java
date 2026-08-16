package app.healthfamily.domain.schedule;

import app.healthfamily.domain.shared.DomainException;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;

/**
 * 服薬スケジュールの集約ルート。
 *
 * <p>「いつ飲む予定か」と「その予定が守られているか」を判断する。
 * この判断はこれまでフロントの表示ロジックにあり、端末の時計とタイムゾーンに
 * 依存していた。通知はサーバー起点でしか撃てないので、判定もサーバーに置く。
 *
 * <p>繰り返しの指定は 3 通りある。
 *
 * <ul>
 *   <li>曜日指定（空なら毎日）</li>
 *   <li>N 日ごと（開始日からの経過で決まる）</li>
 *   <li>頓服（決まった予定日を持たない）</li>
 * </ul>
 */
public class Schedule {

    /** 頓服を表す間隔の値。DB に -1 で入っている */
    public static final int AS_NEEDED = -1;

    /** この分数を超えたら警告 */
    private static final long WARNING_MINUTES = 30;

    /** この分数を超えたら危険 */
    private static final long DANGER_MINUTES = 60;

    private final String id;
    private final String medicationId;
    private final String userId;
    private final String memberId;
    private final LocalTime scheduledTime;
    private final Set<DayOfWeek> daysOfWeek;
    private final Integer intervalDays;
    private final LocalDate startDate;
    private final boolean enabled;
    private final int reminderMinutesBefore;

    private Schedule(Builder b) {
        if (b.id == null || b.id.isBlank()) {
            throw DomainException.validation("スケジュールIDは必須です");
        }
        if (b.userId == null || b.userId.isBlank()) {
            throw DomainException.validation("所有ユーザーは必須です");
        }
        if (b.scheduledTime == null) {
            throw DomainException.validation("予定時刻は必須です");
        }
        if (b.intervalDays != null && b.intervalDays == 0) {
            throw DomainException.validation("繰り返しの間隔に 0 は指定できません");
        }
        if (b.intervalDays != null && b.intervalDays < AS_NEEDED) {
            throw DomainException.validation("繰り返しの間隔が不正です");
        }
        if (b.reminderMinutesBefore < 0) {
            throw DomainException.validation("リマインダーの事前分数に負の値は指定できません");
        }
        this.id = b.id;
        this.medicationId = b.medicationId;
        this.userId = b.userId;
        this.memberId = b.memberId;
        this.scheduledTime = b.scheduledTime;
        this.daysOfWeek =
                b.daysOfWeek == null || b.daysOfWeek.isEmpty()
                        ? EnumSet.noneOf(DayOfWeek.class)
                        : EnumSet.copyOf(b.daysOfWeek);
        this.intervalDays = b.intervalDays;
        this.startDate = b.startDate;
        this.enabled = b.enabled;
        this.reminderMinutesBefore = b.reminderMinutesBefore;
    }

    // --- 振る舞い ---------------------------------------------------------

    /** 頓服か。決まった予定日を持たない。 */
    public boolean isAsNeeded() {
        return intervalDays != null && intervalDays == AS_NEEDED;
    }

    /**
     * その日に服用予定があるか。
     *
     * <p>無効なスケジュールと頓服は常に対象外。
     */
    public boolean isDueOn(LocalDate date) {
        if (!enabled || isAsNeeded()) {
            return false;
        }
        if (startDate != null && date.isBefore(startDate)) {
            return false;
        }
        if (intervalDays != null && intervalDays > 0) {
            LocalDate from = startDate == null ? date : startDate;
            return ChronoUnit.DAYS.between(from, date) % intervalDays == 0;
        }
        return daysOfWeek.isEmpty() || daysOfWeek.contains(date.getDayOfWeek());
    }

    /** その時点での服用状況。 */
    public DoseStatus statusAt(LocalDateTime now, boolean completed) {
        if (completed) {
            return DoseStatus.COMPLETED;
        }
        return now.isAfter(scheduledAt(now.toLocalDate())) ? DoseStatus.OVERDUE : DoseStatus.PENDING;
    }

    /** 超過の深刻度。 */
    public OverdueLevel overdueLevelAt(LocalDateTime now, boolean completed) {
        long minutes = overdueMinutesAt(now, completed);
        if (minutes >= DANGER_MINUTES) {
            return OverdueLevel.DANGER;
        }
        if (minutes >= WARNING_MINUTES) {
            return OverdueLevel.WARNING;
        }
        return OverdueLevel.NONE;
    }

    /** 予定時刻からの超過分数。まだ来ていない、または記録済みなら 0。 */
    public long overdueMinutesAt(LocalDateTime now, boolean completed) {
        if (completed) {
            return 0;
        }
        Duration elapsed = Duration.between(scheduledAt(now.toLocalDate()), now);
        return elapsed.isNegative() ? 0 : elapsed.toMinutes();
    }

    /** その日の予定時刻。 */
    public LocalDateTime scheduledAt(LocalDate date) {
        return LocalDateTime.of(date, scheduledTime);
    }

    public void requireOwnedBy(String candidateUserId) {
        if (!userId.equals(candidateUserId)) {
            throw DomainException.forbidden("このスケジュールにアクセスする権限がありません");
        }
    }

    // --- 参照 -------------------------------------------------------------

    public String id() {
        return id;
    }

    public String medicationId() {
        return medicationId;
    }

    public String userId() {
        return userId;
    }

    public String memberId() {
        return memberId;
    }

    public LocalTime scheduledTime() {
        return scheduledTime;
    }

    /** 空なら毎日。外からは書き換えられない。 */
    public Set<DayOfWeek> daysOfWeek() {
        return Collections.unmodifiableSet(daysOfWeek);
    }

    public Optional<Integer> intervalDays() {
        return Optional.ofNullable(intervalDays);
    }

    public Optional<LocalDate> startDate() {
        return Optional.ofNullable(startDate);
    }

    public boolean enabled() {
        return enabled;
    }

    public int reminderMinutesBefore() {
        return reminderMinutesBefore;
    }

    // --- 組み立て ---------------------------------------------------------

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private String id;
        private String medicationId;
        private String userId;
        private String memberId;
        private LocalTime scheduledTime;
        private Set<DayOfWeek> daysOfWeek;
        private Integer intervalDays;
        private LocalDate startDate;
        private boolean enabled = true;
        private int reminderMinutesBefore;

        public Builder id(String v) {
            this.id = v;
            return this;
        }

        public Builder medicationId(String v) {
            this.medicationId = v;
            return this;
        }

        public Builder userId(String v) {
            this.userId = v;
            return this;
        }

        public Builder memberId(String v) {
            this.memberId = v;
            return this;
        }

        public Builder scheduledTime(LocalTime v) {
            this.scheduledTime = v;
            return this;
        }

        public Builder daysOfWeek(Set<DayOfWeek> v) {
            this.daysOfWeek = v;
            return this;
        }

        public Builder intervalDays(Integer v) {
            this.intervalDays = v;
            return this;
        }

        public Builder startDate(LocalDate v) {
            this.startDate = v;
            return this;
        }

        public Builder enabled(boolean v) {
            this.enabled = v;
            return this;
        }

        public Builder reminderMinutesBefore(int v) {
            this.reminderMinutesBefore = v;
            return this;
        }

        public Schedule build() {
            return new Schedule(this);
        }
    }
}
