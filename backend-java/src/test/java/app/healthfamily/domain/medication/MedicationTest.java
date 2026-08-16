package app.healthfamily.domain.medication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.shared.DomainException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("Medication 集約")
class MedicationTest {

    private static final Instant NOW = Instant.parse("2026-08-04T12:00:00Z");

    private static Medication.Builder prn() {
        return Medication.builder()
                .id("med-1")
                .userId("user-1")
                .memberId("member-1")
                .name("ロキソニン")
                .category(MedicationCategory.PRN)
                .status(MedicationStatus.ACTIVE)
                .interval(DosingInterval.ofHours(4));
    }

    private static Medication.Builder regular() {
        return Medication.builder()
                .id("med-2")
                .userId("user-1")
                .memberId("member-1")
                .name("血圧の薬")
                .category(MedicationCategory.REGULAR)
                .status(MedicationStatus.ACTIVE);
    }

    @Nested
    @DisplayName("服用の記録")
    class Take {

        @Test
        @DisplayName("初回は前回服用時刻がなくても服用できる")
        void firstDoseIsAllowed() {
            var med = prn().build();

            var taken = med.take(NOW, Optional.empty());

            assertThat(taken.medicationId()).isEqualTo("med-1");
            assertThat(taken.takenAt()).isEqualTo(NOW);
        }

        @Test
        @DisplayName("休薬中の薬は服用を記録できない")
        void pausedMedicationRejectsTaking() {
            var med = prn().status(MedicationStatus.PAUSED).build();

            assertThatThrownBy(() -> med.take(NOW, Optional.empty()))
                    .isInstanceOf(DomainException.Conflict.class)
                    .hasMessageContaining("休薬中");
        }

        @Test
        @DisplayName("中止した薬は服用を記録できない")
        void stoppedMedicationRejectsTaking() {
            var med = prn().status(MedicationStatus.STOPPED).build();

            assertThatThrownBy(() -> med.take(NOW, Optional.empty()))
                    .isInstanceOf(DomainException.Conflict.class)
                    .hasMessageContaining("中止");
        }

        @Test
        @DisplayName("頓服薬は服用間隔が空いていないと記録できない")
        void prnRejectsTakingWithinInterval() {
            var med = prn().build();
            var lastTaken = NOW.minus(Duration.ofHours(3));

            assertThatThrownBy(() -> med.take(NOW, Optional.of(lastTaken)))
                    .isInstanceOf(DomainException.Conflict.class)
                    .hasMessageContaining("4 時間")
                    .hasMessageContaining("60 分");
        }

        @Test
        @DisplayName("ちょうど服用間隔ぶん経過していれば服用できる")
        void prnAllowsTakingExactlyAtInterval() {
            var med = prn().build();
            var lastTaken = NOW.minus(Duration.ofHours(4));

            var taken = med.take(NOW, Optional.of(lastTaken));

            assertThat(taken.takenAt()).isEqualTo(NOW);
        }

        @Test
        @DisplayName("定時薬は服用間隔の制約を受けない")
        void regularIgnoresInterval() {
            var med = regular().interval(DosingInterval.ofHours(4)).build();
            var lastTaken = NOW.minus(Duration.ofMinutes(1));

            var taken = med.take(NOW, Optional.of(lastTaken));

            assertThat(taken.takenAt()).isEqualTo(NOW);
        }

        @Test
        @DisplayName("残数を管理していれば服用で 1 減る")
        void takingDecrementsStock() {
            var med = prn().stock(StockQuantity.of(3)).build();

            var taken = med.take(NOW, Optional.empty());

            assertThat(taken.remainingStock()).contains(StockQuantity.of(2));
            assertThat(med.stock()).contains(StockQuantity.of(2));
        }

        @Test
        @DisplayName("残数が 0 なら服用を記録できない")
        void takingWithEmptyStockIsRejected() {
            var med = prn().stock(StockQuantity.of(0)).build();

            assertThatThrownBy(() -> med.take(NOW, Optional.empty()))
                    .isInstanceOf(DomainException.Conflict.class)
                    .hasMessageContaining("残数が 0");
        }

        @Test
        @DisplayName("残数を管理していない薬は残数が空のまま服用できる")
        void takingWithoutStockTracking() {
            var med = prn().build();

            var taken = med.take(NOW, Optional.empty());

            assertThat(taken.remainingStock()).isEmpty();
            assertThat(taken.depletedStock()).isFalse();
        }

        @Test
        @DisplayName("最後の 1 錠を服用すると残数切れが分かる")
        void lastDoseReportsDepletion() {
            var med = prn().stock(StockQuantity.of(1)).build();

            var taken = med.take(NOW, Optional.empty());

            assertThat(taken.depletedStock()).isTrue();
        }

        @Test
        @DisplayName("服用量は薬の設定から引き継がれる")
        void dosageIsCarriedOver() {
            var med = prn().dosageAmount("1錠").build();

            assertThat(med.take(NOW, Optional.empty()).dosageAmount()).contains("1錠");
        }
    }

    @Nested
    @DisplayName("次回服用可能時刻")
    class NextAvailable {

        @Test
        @DisplayName("頓服薬は前回服用時刻から間隔ぶん後になる")
        void prnReturnsNextTime() {
            var med = prn().build();
            var lastTaken = NOW.minus(Duration.ofHours(1));

            assertThat(med.nextAvailableAt(Optional.of(lastTaken)))
                    .contains(lastTaken.plus(Duration.ofHours(4)));
        }

        @Test
        @DisplayName("初回は算出できない")
        void firstDoseHasNoNextTime() {
            assertThat(prn().build().nextAvailableAt(Optional.empty())).isEmpty();
        }

        @Test
        @DisplayName("定時薬は算出しない")
        void regularHasNoNextTime() {
            var med = regular().interval(DosingInterval.ofHours(4)).build();

            assertThat(med.nextAvailableAt(Optional.of(NOW))).isEmpty();
        }
    }

    @Nested
    @DisplayName("残数アラート")
    class LowStock {

        private static final LocalDate TODAY = LocalDate.of(2026, 8, 4);

        @Test
        @DisplayName("アラート日までの残り日数より残数が少なければ少ないと判定する")
        void belowRemainingDaysIsLow() {
            var med = prn().stock(StockQuantity.of(3)).stockAlertDate(TODAY.plusDays(10)).build();

            assertThat(med.isLowStock(TODAY)).isTrue();
        }

        @Test
        @DisplayName("残り日数以上の残数があれば少なくない")
        void enoughStockIsNotLow() {
            var med = prn().stock(StockQuantity.of(30)).stockAlertDate(TODAY.plusDays(10)).build();

            assertThat(med.isLowStock(TODAY)).isFalse();
        }

        @Test
        @DisplayName("残数を管理していなければ判定しない")
        void withoutStockIsNotLow() {
            assertThat(prn().stockAlertDate(TODAY.plusDays(10)).build().isLowStock(TODAY)).isFalse();
        }

        @Test
        @DisplayName("アラート日が未設定なら判定しない")
        void withoutAlertDateIsNotLow() {
            assertThat(prn().stock(StockQuantity.of(1)).build().isLowStock(TODAY)).isFalse();
        }

        @Test
        @DisplayName("アラート日を過ぎていれば判定しない（期限超過は別扱い）")
        void pastAlertDateIsNotLow() {
            var med = prn().stock(StockQuantity.of(1)).stockAlertDate(TODAY.minusDays(1)).build();

            assertThat(med.isLowStock(TODAY)).isFalse();
        }
    }

    @Nested
    @DisplayName("所有権")
    class Ownership {

        @Test
        @DisplayName("所有者なら通る")
        void ownerPasses() {
            prn().build().requireOwnedBy("user-1");
        }

        @Test
        @DisplayName("所有者でなければ拒否する")
        void nonOwnerIsRejected() {
            assertThatThrownBy(() -> prn().build().requireOwnedBy("user-2"))
                    .isInstanceOf(DomainException.Forbidden.class);
        }
    }

    @Nested
    @DisplayName("組み立て時の検証")
    class Construction {

        @Test
        @DisplayName("名前は必須")
        void nameIsRequired() {
            assertThatThrownBy(() -> prn().name(" ").build())
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("名前は必須");
        }

        @Test
        @DisplayName("所有ユーザーは必須")
        void userIsRequired() {
            assertThatThrownBy(() -> prn().userId(null).build())
                    .isInstanceOf(DomainException.Validation.class);
        }
    }
}
