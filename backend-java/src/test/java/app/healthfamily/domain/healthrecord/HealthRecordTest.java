package app.healthfamily.domain.healthrecord;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.shared.DomainException;
import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("健康記録のドメイン")
class HealthRecordTest {

    @Nested
    @DisplayName("体温")
    class Temperature {

        @ParameterizedTest
        @ValueSource(doubles = {29.9, 45.1, 0.0, -1.0})
        @DisplayName("人体としてありえない値は受け付けない")
        void impossibleValuesAreRejected(double value) {
            assertThatThrownBy(() -> BodyTemperature.of(value))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("体温");
        }

        @ParameterizedTest
        @ValueSource(doubles = {30.0, 36.5, 45.0})
        @DisplayName("ありうる範囲は受け付ける")
        void plausibleValuesAreAccepted(double value) {
            assertThatCode(() -> BodyTemperature.of(value)).doesNotThrowAnyException();
        }

        @ParameterizedTest(name = "{0}度 -> {1}")
        @CsvSource({
            "35.9, LOW",
            "36.0, NORMAL",
            "37.4, NORMAL",
            "37.5, SLIGHT_FEVER",
            "37.9, SLIGHT_FEVER",
            "38.0, FEVER",
            "39.0, FEVER",
        })
        @DisplayName("発熱の段階を判定する")
        void classifiesFever(double value, FeverLevel expected) {
            assertThat(BodyTemperature.of(value).level()).isEqualTo(expected);
        }

        @Test
        @DisplayName("小数第1位に丸める。測定器の精度以上の桁は持たない")
        void roundsToOneDecimal() {
            assertThat(BodyTemperature.of(36.55).value()).isEqualTo(36.6);
            assertThat(BodyTemperature.of(36.44).value()).isEqualTo(36.4);
        }
    }

    @Nested
    @DisplayName("体格")
    class Measurement {

        @Test
        @DisplayName("身長と体重から BMI を求める")
        void computesBmi() {
            var measurement = BodyMeasurement.of(60.0, 170.0);

            assertThat(measurement.bmi()).contains(20.8);
        }

        @Test
        @DisplayName("身長が無ければ BMI は出せない")
        void withoutHeightNoBmi() {
            assertThat(BodyMeasurement.of(60.0, null).bmi()).isEmpty();
        }

        @Test
        @DisplayName("体重が無ければ BMI は出せない")
        void withoutWeightNoBmi() {
            assertThat(BodyMeasurement.of(null, 170.0).bmi()).isEmpty();
        }

        @Test
        @DisplayName("体重も身長も無い記録は作れない")
        void emptyMeasurementIsRejected() {
            assertThatThrownBy(() -> BodyMeasurement.of(null, null))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("体重か身長");
        }

        @ParameterizedTest
        @ValueSource(doubles = {0.0, -1.0, 1001.0})
        @DisplayName("ありえない体重は受け付けない")
        void impossibleWeightIsRejected(double weight) {
            assertThatThrownBy(() -> BodyMeasurement.of(weight, 170.0))
                    .isInstanceOf(DomainException.Validation.class);
        }

        @ParameterizedTest
        @ValueSource(doubles = {0.0, -1.0, 301.0})
        @DisplayName("ありえない身長は受け付けない")
        void impossibleHeightIsRejected(double height) {
            assertThatThrownBy(() -> BodyMeasurement.of(60.0, height))
                    .isInstanceOf(DomainException.Validation.class);
        }
    }

    @Nested
    @DisplayName("ワクチンの次回接種")
    class Vaccination {

        private static final LocalDate TODAY = LocalDate.of(2026, 8, 16);

        @Test
        @DisplayName("次回予定日が未設定なら通知しない")
        void withoutNextDateNoReminder() {
            var v = VaccinationSchedule.of(LocalDate.of(2026, 1, 1), null);

            assertThat(v.needsReminderOn(TODAY)).isFalse();
            assertThat(v.daysUntilNext(TODAY)).isEmpty();
        }

        @ParameterizedTest(name = "{0}日後 -> 通知 {1}")
        @CsvSource({
            "8, false",
            "7, true",
            "1, true",
            "0, true",
        })
        @DisplayName("次回接種の1週間前から通知する")
        void remindsOneWeekBefore(int daysAhead, boolean expected) {
            var v = VaccinationSchedule.of(LocalDate.of(2026, 1, 1), TODAY.plusDays(daysAhead));

            assertThat(v.needsReminderOn(TODAY)).isEqualTo(expected);
        }

        @Test
        @DisplayName("予定日を過ぎていても通知し続ける")
        void overdueStillReminds() {
            var v = VaccinationSchedule.of(LocalDate.of(2026, 1, 1), TODAY.minusDays(3));

            assertThat(v.needsReminderOn(TODAY)).isTrue();
            assertThat(v.isOverdueOn(TODAY)).isTrue();
            assertThat(v.daysUntilNext(TODAY)).contains(-3L);
        }

        @Test
        @DisplayName("次回予定日が接種日より前は受け付けない")
        void nextBeforeVaccinatedIsRejected() {
            assertThatThrownBy(
                            () ->
                                    VaccinationSchedule.of(
                                            LocalDate.of(2026, 6, 1), LocalDate.of(2026, 5, 1)))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("次回接種日");
        }
    }
}
