package app.healthfamily.domain.schedule;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.shared.DomainException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

@DisplayName("Schedule 集約")
class ScheduleTest {

    /** 2026-08-16 は日曜日 */
    private static final LocalDate SUNDAY = LocalDate.of(2026, 8, 16);

    private static Schedule.Builder base() {
        return Schedule.builder()
                .id("s-1")
                .medicationId("med-1")
                .userId("user-1")
                .memberId("member-1")
                .scheduledTime(LocalTime.of(8, 0));
    }

    @Nested
    @DisplayName("服用予定日の判定")
    class DueOn {

        @Test
        @DisplayName("曜日指定が空なら毎日が対象")
        void emptyDaysMeansEveryDay() {
            var schedule = base().build();

            for (int i = 0; i < 7; i++) {
                assertThat(schedule.isDueOn(SUNDAY.plusDays(i))).isTrue();
            }
        }

        @Test
        @DisplayName("曜日指定があればその曜日だけが対象")
        void onlySpecifiedDays() {
            var schedule = base().daysOfWeek(EnumSet.of(DayOfWeek.MONDAY, DayOfWeek.FRIDAY)).build();

            assertThat(schedule.isDueOn(LocalDate.of(2026, 8, 17))).isTrue(); // 月
            assertThat(schedule.isDueOn(LocalDate.of(2026, 8, 21))).isTrue(); // 金
            assertThat(schedule.isDueOn(LocalDate.of(2026, 8, 18))).isFalse(); // 火
        }

        @Test
        @DisplayName("N日ごとの指定は開始日からの経過で決まる")
        void everyNDays() {
            var schedule = base().intervalDays(3).startDate(SUNDAY).build();

            assertThat(schedule.isDueOn(SUNDAY)).isTrue();
            assertThat(schedule.isDueOn(SUNDAY.plusDays(1))).isFalse();
            assertThat(schedule.isDueOn(SUNDAY.plusDays(3))).isTrue();
            assertThat(schedule.isDueOn(SUNDAY.plusDays(6))).isTrue();
        }

        @Test
        @DisplayName("開始日より前は対象にならない")
        void beforeStartDateIsNotDue() {
            var schedule = base().intervalDays(3).startDate(SUNDAY).build();

            assertThat(schedule.isDueOn(SUNDAY.minusDays(1))).isFalse();
        }

        @Test
        @DisplayName("頓服は決まった予定日を持たない")
        void asNeededHasNoDueDate() {
            var schedule = base().intervalDays(Schedule.AS_NEEDED).build();

            assertThat(schedule.isAsNeeded()).isTrue();
            assertThat(schedule.isDueOn(SUNDAY)).isFalse();
        }

        @Test
        @DisplayName("無効なスケジュールは対象にならない")
        void disabledIsNotDue() {
            var schedule = base().enabled(false).build();

            assertThat(schedule.isDueOn(SUNDAY)).isFalse();
        }
    }

    @Nested
    @DisplayName("服用状況の判定")
    class Status {

        private static final LocalDateTime SCHEDULED = LocalDateTime.of(2026, 8, 16, 8, 0);

        @Test
        @DisplayName("記録済みなら完了")
        void completed() {
            assertThat(base().build().statusAt(SCHEDULED.plusHours(5), true))
                    .isEqualTo(DoseStatus.COMPLETED);
        }

        @Test
        @DisplayName("予定時刻より前なら未服用")
        void beforeScheduledIsPending() {
            assertThat(base().build().statusAt(SCHEDULED.minusMinutes(1), false))
                    .isEqualTo(DoseStatus.PENDING);
        }

        @Test
        @DisplayName("予定時刻ちょうどはまだ未服用")
        void exactlyAtScheduledIsPending() {
            assertThat(base().build().statusAt(SCHEDULED, false)).isEqualTo(DoseStatus.PENDING);
        }

        @Test
        @DisplayName("予定時刻を過ぎたら超過")
        void afterScheduledIsOverdue() {
            assertThat(base().build().statusAt(SCHEDULED.plusMinutes(1), false))
                    .isEqualTo(DoseStatus.OVERDUE);
        }
    }

    @Nested
    @DisplayName("超過の深刻度")
    class Overdue {

        private static final LocalDateTime SCHEDULED = LocalDateTime.of(2026, 8, 16, 8, 0);

        @ParameterizedTest(name = "{0}分超過 -> {1}")
        @CsvSource({
            "0, NONE",
            "29, NONE",
            "30, WARNING",
            "59, WARNING",
            "60, DANGER",
            "600, DANGER",
        })
        @DisplayName("超過時間に応じて段階が上がる")
        void levelByElapsedMinutes(int minutes, OverdueLevel expected) {
            assertThat(base().build().overdueLevelAt(SCHEDULED.plusMinutes(minutes), false))
                    .isEqualTo(expected);
        }

        @Test
        @DisplayName("記録済みなら超過しない")
        void completedIsNeverOverdue() {
            assertThat(base().build().overdueLevelAt(SCHEDULED.plusHours(10), true))
                    .isEqualTo(OverdueLevel.NONE);
        }

        @Test
        @DisplayName("超過分数を返す")
        void overdueMinutes() {
            var schedule = base().build();

            assertThat(schedule.overdueMinutesAt(SCHEDULED.plusMinutes(45), false)).isEqualTo(45);
            assertThat(schedule.overdueMinutesAt(SCHEDULED.minusMinutes(10), false)).isZero();
            assertThat(schedule.overdueMinutesAt(SCHEDULED.plusMinutes(45), true)).isZero();
        }
    }

    @Nested
    @DisplayName("組み立て時の検証")
    class Construction {

        @Test
        @DisplayName("予定時刻は必須")
        void scheduledTimeIsRequired() {
            assertThatThrownBy(() -> base().scheduledTime(null).build())
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("予定時刻は必須");
        }

        @Test
        @DisplayName("N日ごとの N は 0 を許さない")
        void zeroIntervalIsRejected() {
            assertThatThrownBy(() -> base().intervalDays(0).build())
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("間隔");
        }

        @Test
        @DisplayName("リマインダーの事前分数は負を許さない")
        void negativeReminderIsRejected() {
            assertThatThrownBy(() -> base().reminderMinutesBefore(-1).build())
                    .isInstanceOf(DomainException.Validation.class);
        }

        @Test
        @DisplayName("曜日集合は外から書き換えられない")
        void daysAreDefensivelyCopied() {
            Set<DayOfWeek> mutable = EnumSet.of(DayOfWeek.MONDAY);
            var schedule = base().daysOfWeek(mutable).build();

            mutable.add(DayOfWeek.TUESDAY);

            assertThat(schedule.daysOfWeek()).containsExactly(DayOfWeek.MONDAY);
        }
    }

    @Nested
    @DisplayName("所有権")
    class Ownership {

        @Test
        @DisplayName("所有者でなければ拒否する")
        void nonOwnerIsRejected() {
            assertThatThrownBy(() -> base().build().requireOwnedBy("user-2"))
                    .isInstanceOf(DomainException.Forbidden.class);
        }
    }
}
