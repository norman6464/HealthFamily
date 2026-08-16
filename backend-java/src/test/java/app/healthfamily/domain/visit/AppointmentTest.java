package app.healthfamily.domain.visit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.shared.DomainException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

@DisplayName("Appointment 集約")
class AppointmentTest {

    private static final ZoneId TOKYO = ZoneId.of("Asia/Tokyo");
    private static final LocalDate TODAY = LocalDate.of(2026, 8, 16);

    private static Appointment at(LocalDate date, boolean enabled, int daysBefore) {
        return new Appointment(
                "a-1",
                "user-1",
                "member-1",
                "h-1",
                "checkup",
                date.atStartOfDay(TOKYO).toInstant(),
                "定期検診",
                null,
                3000.0,
                enabled,
                daysBefore);
    }

    @Nested
    @DisplayName("通知の要否")
    class Reminder {

        @ParameterizedTest(name = "{0}日後 / {1}日前設定 -> {2}")
        @CsvSource({
            "0, 1, true",
            "1, 1, true",
            "2, 1, false",
            "3, 3, true",
            "4, 3, false",
        })
        @DisplayName("設定した日数以内なら通知する")
        void remindsWithinConfiguredDays(int daysAhead, int daysBefore, boolean expected) {
            var appointment = at(TODAY.plusDays(daysAhead), true, daysBefore);

            assertThat(appointment.needsReminderOn(TODAY, TOKYO)).isEqualTo(expected);
        }

        @Test
        @DisplayName("過ぎた予約は通知しない。済んだ予定を知らせても行動につながらない")
        void pastAppointmentDoesNotRemind() {
            var appointment = at(TODAY.minusDays(1), true, 7);

            assertThat(appointment.needsReminderOn(TODAY, TOKYO)).isFalse();
            assertThat(appointment.daysUntil(TODAY, TOKYO)).isEqualTo(-1);
        }

        @Test
        @DisplayName("通知が無効なら出さない")
        void disabledDoesNotRemind() {
            assertThat(at(TODAY, false, 7).needsReminderOn(TODAY, TOKYO)).isFalse();
        }
    }

    @Nested
    @DisplayName("組み立て時の検証")
    class Construction {

        @Test
        @DisplayName("通院日時は必須")
        void dateIsRequired() {
            assertThatThrownBy(
                            () ->
                                    new Appointment(
                                            "a-2", "user-1", "member-1", null, "checkup", null, null, null,
                                            null, true, 1))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("通院日時");
        }

        @Test
        @DisplayName("費用に負の値は指定できない")
        void negativeCostIsRejected() {
            assertThatThrownBy(
                            () ->
                                    new Appointment(
                                            "a-3", "user-1", "member-1", null, "checkup",
                                            Instant.parse("2026-08-16T00:00:00Z"), null, null, -1.0,
                                            true, 1))
                    .isInstanceOf(DomainException.Validation.class);
        }

        @Test
        @DisplayName("事前日数は0〜365日の範囲")
        void reminderDaysRange() {
            assertThatThrownBy(() -> at(TODAY, true, 366))
                    .isInstanceOf(DomainException.Validation.class);
            assertThatThrownBy(() -> at(TODAY, true, -1))
                    .isInstanceOf(DomainException.Validation.class);
        }
    }

    @Nested
    @DisplayName("所有権")
    class Ownership {

        @Test
        @DisplayName("他人の通院記録は操作できない")
        void nonOwnerIsRejected() {
            assertThatThrownBy(() -> at(TODAY, true, 1).requireOwnedBy("user-2", "通院記録"))
                    .isInstanceOf(DomainException.Forbidden.class);
        }
    }
}
