package app.healthfamily.domain.expense;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.shared.DomainException;
import java.time.YearMonth;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("Budget 集約")
class BudgetTest {

    private static final YearMonth AUGUST = YearMonth.of(2026, 8);

    private static Budget budget(int monthly, boolean alertEnabled, String lastAlerted) {
        return Budget.reconstitute(
                "b-1", "user-1", monthly, alertEnabled, lastAlerted, Map.of("pharmacy", 5_000));
    }

    @Nested
    @DisplayName("超過の判定")
    class OverBudget {

        @Test
        @DisplayName("月予算を超えたら超過")
        void exceedsMonthlyAmount() {
            var status = budget(30_000, true, null).evaluate(AUGUST, 30_001, Map.of());

            assertThat(status.overBudget()).isTrue();
        }

        @Test
        @DisplayName("ちょうど同額は超過ではない")
        void exactAmountIsNotOver() {
            var status = budget(30_000, true, null).evaluate(AUGUST, 30_000, Map.of());

            assertThat(status.overBudget()).isFalse();
        }

        @Test
        @DisplayName("月予算が0なら判定しない")
        void zeroBudgetNeverOver() {
            var status = budget(0, true, null).evaluate(AUGUST, 100_000, Map.of());

            assertThat(status.overBudget()).isFalse();
        }

        @Test
        @DisplayName("カテゴリ別の超過も拾う")
        void detectsOverCategories() {
            var status =
                    budget(100_000, true, null)
                            .evaluate(AUGUST, 10_000, Map.of("pharmacy", 5_001, "hospital", 1_000));

            assertThat(status.overCategories()).containsExactly("pharmacy");
        }

        @Test
        @DisplayName("カテゴリ予算ちょうどは超過ではない")
        void categoryExactIsNotOver() {
            var status = budget(100_000, true, null).evaluate(AUGUST, 0, Map.of("pharmacy", 5_000));

            assertThat(status.overCategories()).isEmpty();
        }
    }

    @Nested
    @DisplayName("通知の可否")
    class Alerting {

        @Test
        @DisplayName("超過していて未通知なら通知する")
        void notifiesWhenOverAndNotYetAlerted() {
            var status = budget(10_000, true, null).evaluate(AUGUST, 20_000, Map.of());

            assertThat(status.shouldNotify()).isTrue();
        }

        @Test
        @DisplayName("同じ月に通知済みなら重複して通知しない")
        void doesNotNotifyTwiceInSameMonth() {
            var status = budget(10_000, true, "2026-08").evaluate(AUGUST, 20_000, Map.of());

            assertThat(status.shouldNotify()).isFalse();
        }

        @Test
        @DisplayName("先月通知済みでも今月は通知する")
        void notifiesAgainInNewMonth() {
            var status = budget(10_000, true, "2026-07").evaluate(AUGUST, 20_000, Map.of());

            assertThat(status.shouldNotify()).isTrue();
        }

        @Test
        @DisplayName("通知が無効なら通知しない")
        void doesNotNotifyWhenDisabled() {
            var status = budget(10_000, false, null).evaluate(AUGUST, 20_000, Map.of());

            assertThat(status.shouldNotify()).isFalse();
        }

        @Test
        @DisplayName("超過していなければ通知しない")
        void doesNotNotifyWhenWithinBudget() {
            var status = budget(100_000, true, null).evaluate(AUGUST, 20_000, Map.of());

            assertThat(status.shouldNotify()).isFalse();
        }

        @Test
        @DisplayName("カテゴリだけ超過でも通知する")
        void notifiesOnCategoryOverrun() {
            var status =
                    budget(1_000_000, true, null).evaluate(AUGUST, 10_000, Map.of("pharmacy", 9_999));

            assertThat(status.overBudget()).isFalse();
            assertThat(status.shouldNotify()).isTrue();
        }
    }

    @Nested
    @DisplayName("組み立て時の検証")
    class Construction {

        @Test
        @DisplayName("月予算に負の値は指定できない")
        void negativeMonthlyIsRejected() {
            assertThatThrownBy(() -> budget(-1, true, null))
                    .isInstanceOf(DomainException.Validation.class);
        }

        @Test
        @DisplayName("カテゴリ予算に負の値は指定できない")
        void negativeCategoryIsRejected() {
            assertThatThrownBy(
                            () ->
                                    Budget.reconstitute(
                                            "b-2", "user-1", 1000, true, null, Map.of("pharmacy", -1)))
                    .isInstanceOf(DomainException.Validation.class);
        }
    }
}
