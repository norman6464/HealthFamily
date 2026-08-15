package app.healthfamily.medication.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.shared.DomainException;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("値オブジェクト")
class ValueObjectTest {

    @Nested
    @DisplayName("StockQuantity")
    class Stock {

        @Test
        @DisplayName("負の残数は作れない")
        void negativeIsRejected() {
            assertThatThrownBy(() -> StockQuantity.of(-1))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("負の値");
        }

        @Test
        @DisplayName("1 消費すると 1 減る")
        void consumeOneDecrements() {
            assertThat(StockQuantity.of(5).consumeOne()).isEqualTo(StockQuantity.of(4));
        }

        @Test
        @DisplayName("0 からは消費できない")
        void consumeFromEmptyIsRejected() {
            assertThatThrownBy(() -> StockQuantity.of(0).consumeOne())
                    .isInstanceOf(DomainException.Conflict.class);
        }

        @Test
        @DisplayName("消費しても元の値は変わらない（不変）")
        void isImmutable() {
            var original = StockQuantity.of(5);
            original.consumeOne();
            assertThat(original.value()).isEqualTo(5);
        }

        @Test
        @DisplayName("残り日数との比較")
        void comparesWithDays() {
            assertThat(StockQuantity.of(3).isBelow(10)).isTrue();
            assertThat(StockQuantity.of(10).isBelow(10)).isFalse();
            assertThat(StockQuantity.of(30).isBelow(10)).isFalse();
        }
    }

    @Nested
    @DisplayName("DosingInterval")
    class Interval {

        @ParameterizedTest
        @ValueSource(ints = {0, -1, 169})
        @DisplayName("範囲外の間隔は作れない")
        void outOfRangeIsRejected(int hours) {
            assertThatThrownBy(() -> DosingInterval.ofHours(hours))
                    .isInstanceOf(DomainException.Validation.class);
        }

        @Test
        @DisplayName("次に服用できる時刻を求められる")
        void computesNextAvailable() {
            var last = Instant.parse("2026-08-04T09:00:00Z");

            assertThat(DosingInterval.ofHours(6).nextAvailableAfter(last))
                    .isEqualTo(Instant.parse("2026-08-04T15:00:00Z"));
        }

        @Test
        @DisplayName("間隔ちょうどは服用可、1 秒でも手前は不可")
        void boundaryIsInclusive() {
            var last = Instant.parse("2026-08-04T09:00:00Z");
            var interval = DosingInterval.ofHours(4);
            var exactly = last.plus(Duration.ofHours(4));

            assertThat(interval.allowsTakingAt(exactly, last)).isTrue();
            assertThat(interval.allowsTakingAt(exactly.minusSeconds(1), last)).isFalse();
        }
    }

    @Nested
    @DisplayName("コード変換")
    class Codes {

        @Test
        @DisplayName("DB に入っている種別をすべて解釈できる")
        void allStoredCategoriesParse() {
            for (var code : new String[] {"regular", "prn", "inhaler", "eye_drops", "supplement"}) {
                assertThat(MedicationCategory.fromCode(code).code()).isEqualTo(code);
            }
        }

        @Test
        @DisplayName("間隔を強制するのは頓服・吸入・点眼")
        void intervalEnforcedCategories() {
            assertThat(MedicationCategory.PRN.enforcesInterval()).isTrue();
            assertThat(MedicationCategory.INHALER.enforcesInterval()).isTrue();
            assertThat(MedicationCategory.EYE_DROPS.enforcesInterval()).isTrue();
            assertThat(MedicationCategory.REGULAR.enforcesInterval()).isFalse();
            assertThat(MedicationCategory.SUPPLEMENT.enforcesInterval()).isFalse();
        }

        @Test
        @DisplayName("DB に入っている状態をすべて解釈できる")
        void allStoredStatusesParse() {
            assertThat(MedicationStatus.fromCode("active").allowsTaking()).isTrue();
            assertThat(MedicationStatus.fromCode("paused").allowsTaking()).isFalse();
        }

        @Test
        @DisplayName("未知のコードは弾く")
        void unknownCodeIsRejected() {
            assertThatThrownBy(() -> MedicationCategory.fromCode("unknown"))
                    .isInstanceOf(DomainException.Validation.class);
        }
    }
}
