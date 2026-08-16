package app.healthfamily.domain.visit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.healthrecord.HealthLog;
import app.healthfamily.domain.shared.DomainException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("検査記録と体調記録")
class ExaminationAndHealthLogTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 8, 16);

    @Nested
    @DisplayName("検査記録")
    class Examinations {

        private static Examination exam(LocalDate next) {
            return new Examination(
                    "e-1", "user-1", "member-1", "健康診断", LocalDate.of(2026, 2, 1), next, null);
        }

        @ParameterizedTest(name = "{0}日後 -> 通知 {1}")
        @CsvSource({"8, false", "7, true", "0, true", "-5, true"})
        @DisplayName("次回の1週間前から通知し、過ぎても止めない")
        void remindsFromOneWeekBefore(int daysAhead, boolean expected) {
            assertThat(exam(TODAY.plusDays(daysAhead)).needsReminderOn(TODAY)).isEqualTo(expected);
        }

        @Test
        @DisplayName("次回予定が無ければ通知しない")
        void withoutNextNoReminder() {
            assertThat(exam(null).needsReminderOn(TODAY)).isFalse();
            assertThat(exam(null).daysUntilNext(TODAY)).isEmpty();
        }

        @Test
        @DisplayName("次回予定日が検査日より前は受け付けない")
        void nextBeforeExaminedIsRejected() {
            assertThatThrownBy(() -> exam(LocalDate.of(2026, 1, 1)))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("次回予定日");
        }

        @Test
        @DisplayName("検査の種類は必須")
        void typeIsRequired() {
            assertThatThrownBy(
                            () ->
                                    new Examination(
                                            "e-2", "user-1", "member-1", " ", TODAY, null, null))
                    .isInstanceOf(DomainException.Validation.class);
        }
    }

    @Nested
    @DisplayName("体調記録")
    class HealthLogs {

        private static HealthLog log(int level, List<String> symptoms) {
            return new HealthLog(
                    "h-1", "user-1", "member-1", level, symptoms, null,
                    Instant.parse("2026-08-16T00:00:00Z"));
        }

        @ParameterizedTest
        @ValueSource(ints = {0, 6, -1})
        @DisplayName("体調は1〜5の範囲外を受け付けない")
        void levelOutOfRangeIsRejected(int level) {
            assertThatThrownBy(() -> log(level, List.of()))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("1〜5");
        }

        @Test
        @DisplayName("体調が悪ければ注意を要する")
        void poorConditionNeedsAttention() {
            assertThat(log(2, List.of()).needsAttention()).isTrue();
            assertThat(log(3, List.of()).needsAttention()).isFalse();
        }

        @Test
        @DisplayName("症状が記録されていれば体調が良くても注意を要する")
        void symptomsNeedAttention() {
            assertThat(log(5, List.of("頭痛")).needsAttention()).isTrue();
        }

        @Test
        @DisplayName("症状リストは外から書き換えられない")
        void symptomsAreImmutable() {
            var symptoms = new java.util.ArrayList<>(List.of("頭痛"));
            var entry = log(3, symptoms);

            symptoms.add("発熱");

            assertThat(entry.symptoms()).containsExactly("頭痛");
            assertThatThrownBy(() -> entry.symptoms().add("腹痛"))
                    .isInstanceOf(UnsupportedOperationException.class);
        }

        @Test
        @DisplayName("症状が未指定なら空リストになる")
        void nullSymptomsBecomeEmpty() {
            assertThat(log(3, null).symptoms()).isEmpty();
        }
    }
}
