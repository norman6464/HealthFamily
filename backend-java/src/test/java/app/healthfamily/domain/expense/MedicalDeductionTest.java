package app.healthfamily.domain.expense;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.shared.DomainException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * 医療費控除の試算。
 *
 * <p>金額の境界を間違えると利用者の申告額を誤らせるので、閾値の前後を明示的に固定する。
 */
@DisplayName("医療費控除の試算")
class MedicalDeductionTest {

    @Nested
    @DisplayName("通常の医療費控除")
    class Regular {

        @ParameterizedTest(name = "対象額 {0}円 -> 控除 {1}円")
        @CsvSource({
            "0, 0",
            "99999, 0",
            "100000, 0",
            "100001, 1",
            "250000, 150000",
        })
        @DisplayName("10万円を超えた分だけが控除対象になる")
        void deductsAboveThreshold(int deductibleTotal, int expected) {
            var result = MedicalDeduction.simulate(deductibleTotal, 0);

            assertThat(result.regularDeduction()).isEqualTo(expected);
        }
    }

    @Nested
    @DisplayName("セルフメディケーション税制")
    class SelfMedication {

        @ParameterizedTest(name = "薬局購入 {0}円 -> 控除 {1}円")
        @CsvSource({
            "0, 0",
            "12000, 0",
            "12001, 1",
            "50000, 38000",
            "100000, 88000",
            "1000000, 88000",
        })
        @DisplayName("1万2千円を超えた分が対象で、8万8千円が上限")
        void deductsBetweenFloorAndCap(int pharmacyTotal, int expected) {
            var result = MedicalDeduction.simulate(0, pharmacyTotal);

            assertThat(result.selfMedicationDeduction()).isEqualTo(expected);
        }
    }

    @Nested
    @DisplayName("どちらを使うべきかの判定")
    class Recommendation {

        @Test
        @DisplayName("どちらも0なら勧めない")
        void bothZeroRecommendsNone() {
            assertThat(MedicalDeduction.simulate(50_000, 5_000).recommended())
                    .isEqualTo(DeductionScheme.NONE);
        }

        @Test
        @DisplayName("通常のほうが大きければ通常を勧める")
        void regularWins() {
            var result = MedicalDeduction.simulate(300_000, 50_000);

            assertThat(result.regularDeduction()).isEqualTo(200_000);
            assertThat(result.selfMedicationDeduction()).isEqualTo(38_000);
            assertThat(result.recommended()).isEqualTo(DeductionScheme.REGULAR);
        }

        @Test
        @DisplayName("セルフメディケーションのほうが大きければそちらを勧める")
        void selfMedicationWins() {
            var result = MedicalDeduction.simulate(110_000, 100_000);

            assertThat(result.regularDeduction()).isEqualTo(10_000);
            assertThat(result.selfMedicationDeduction()).isEqualTo(88_000);
            assertThat(result.recommended()).isEqualTo(DeductionScheme.SELF_MEDICATION);
        }

        @Test
        @DisplayName("同額なら通常を勧める")
        void tieGoesToRegular() {
            // 通常: 138000-100000 = 38000 / セルフメディケーション: 50000-12000 = 38000
            var result = MedicalDeduction.simulate(138_000, 50_000);

            assertThat(result.regularDeduction()).isEqualTo(result.selfMedicationDeduction());
            assertThat(result.recommended()).isEqualTo(DeductionScheme.REGULAR);
        }

        @Test
        @DisplayName("両制度は併用できないので、勧めるのは常に片方だけ")
        void schemesAreExclusive() {
            var result = MedicalDeduction.simulate(300_000, 100_000);

            assertThat(result.recommended()).isIn(DeductionScheme.REGULAR, DeductionScheme.SELF_MEDICATION);
        }
    }

    @Nested
    @DisplayName("入力の検証")
    class Validation {

        @Test
        @DisplayName("負の金額は受け付けない")
        void negativeAmountIsRejected() {
            assertThatThrownBy(() -> MedicalDeduction.simulate(-1, 0))
                    .isInstanceOf(DomainException.Validation.class);
            assertThatThrownBy(() -> MedicalDeduction.simulate(0, -1))
                    .isInstanceOf(DomainException.Validation.class);
        }
    }
}
