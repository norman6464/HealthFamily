package app.healthfamily.domain.prescription;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.shared.DomainException;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("Prescription 集約")
class PrescriptionTest {

    private static final Instant PRESCRIBED_AT = Instant.parse("2026-08-01T00:00:00Z");

    /** 採番を決定的にしてテストを読みやすくする */
    private static Prescription.IdGenerator sequentialIds() {
        var counter = new AtomicInteger();
        return () -> "item-" + counter.incrementAndGet();
    }

    private static Prescription empty() {
        return Prescription.reconstitute(
                "rx-1", "user-1", "member-1", "8月分", PRESCRIBED_AT, null, List.of());
    }

    private static Prescription withItems() {
        var rx = empty();
        rx.replaceItems(
                List.of(
                        new Prescription.ItemDraft("ロキソニン", "1錠", "1日3回", 14),
                        new Prescription.ItemDraft("ムコスタ", "1錠", "1日3回", 14)),
                sequentialIds());
        return rx;
    }

    @Nested
    @DisplayName("明細の入れ替え")
    class ReplaceItems {

        @Test
        @DisplayName("指定した順に並び順が振られる")
        void assignsSortOrderInGivenOrder() {
            var rx = withItems();

            assertThat(rx.items()).extracting(PrescriptionItem::name)
                    .containsExactly("ロキソニン", "ムコスタ");
            assertThat(rx.items()).extracting(PrescriptionItem::sortOrder).containsExactly(0, 1);
        }

        @Test
        @DisplayName("入れ替えると前の明細は残らない")
        void replacesPreviousItems() {
            var rx = withItems();

            rx.replaceItems(
                    List.of(new Prescription.ItemDraft("カロナール", null, null, null)),
                    sequentialIds());

            assertThat(rx.items()).extracting(PrescriptionItem::name).containsExactly("カロナール");
        }

        @Test
        @DisplayName("空の明細は受け付けない")
        void emptyItemsAreRejected() {
            var rx = empty();

            assertThatThrownBy(() -> rx.replaceItems(List.of(), sequentialIds()))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("1件以上");
        }

        @Test
        @DisplayName("薬の名前が空の明細は受け付けない")
        void blankNameIsRejected() {
            var rx = empty();

            assertThatThrownBy(
                            () ->
                                    rx.replaceItems(
                                            List.of(new Prescription.ItemDraft(" ", null, null, null)),
                                            sequentialIds()))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("名前は必須");
        }

        @Test
        @DisplayName("処方日数が0以下の明細は受け付けない")
        void nonPositiveDaysIsRejected() {
            var rx = empty();

            assertThatThrownBy(
                            () ->
                                    rx.replaceItems(
                                            List.of(new Prescription.ItemDraft("薬", null, null, 0)),
                                            sequentialIds()))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("1 日以上");
        }

        @Test
        @DisplayName("明細が多すぎる場合は受け付けない")
        void tooManyItemsAreRejected() {
            var rx = empty();
            var many =
                    java.util.stream.IntStream.range(0, 51)
                            .mapToObj(i -> new Prescription.ItemDraft("薬" + i, null, null, null))
                            .toList();

            assertThatThrownBy(() -> rx.replaceItems(many, sequentialIds()))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("50 件");
        }

        @Test
        @DisplayName("外から明細リストを直接いじれない")
        void itemsAreUnmodifiable() {
            var rx = withItems();

            assertThatThrownBy(() -> rx.items().clear())
                    .isInstanceOf(UnsupportedOperationException.class);
        }
    }

    @Nested
    @DisplayName("調剤")
    class Dispense {

        @Test
        @DisplayName("明細の内容から、作るべき薬の一覧を組み立てる")
        void buildsOrdersFromItems() {
            var orders = withItems().dispense();

            assertThat(orders).hasSize(2);
            assertThat(orders.get(0).name()).isEqualTo("ロキソニン");
            assertThat(orders.get(0).dosage()).isEqualTo("1錠");
            assertThat(orders.get(0).frequency()).isEqualTo("1日3回");
            assertThat(orders).allSatisfy(
                    o -> {
                        assertThat(o.memberId()).isEqualTo("member-1");
                        assertThat(o.userId()).isEqualTo("user-1");
                    });
        }

        @Test
        @DisplayName("明細が無ければ調剤できない")
        void withoutItemsCannotDispense() {
            assertThatThrownBy(() -> empty().dispense())
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("処方明細がありません");
        }

        @Test
        @DisplayName("薬を作るのは集約の仕事ではない。何を作るべきかだけを返す")
        void returnsOrdersOnly() {
            var orders = withItems().dispense();

            // 戻り値は指示であって、永続化された薬ではない
            assertThat(orders).isInstanceOf(List.class);
            assertThat(orders.getFirst()).isInstanceOf(Prescription.DispenseOrder.class);
        }
    }

    @Nested
    @DisplayName("有効期限")
    class Expiry {

        @Test
        @DisplayName("期限を過ぎていれば期限切れ")
        void afterExpiryIsExpired() {
            var rx =
                    Prescription.reconstitute(
                            "rx-2",
                            "user-1",
                            "member-1",
                            "7月分",
                            PRESCRIBED_AT,
                            Instant.parse("2026-08-05T00:00:00Z"),
                            List.of());

            assertThat(rx.isExpired(Instant.parse("2026-08-06T00:00:00Z"))).isTrue();
            assertThat(rx.isExpired(Instant.parse("2026-08-04T00:00:00Z"))).isFalse();
        }

        @Test
        @DisplayName("期限が未設定なら期限切れにならない")
        void withoutExpiryNeverExpires() {
            assertThat(empty().isExpired(Instant.parse("2099-01-01T00:00:00Z"))).isFalse();
        }
    }

    @Nested
    @DisplayName("所有権")
    class Ownership {

        @Test
        @DisplayName("所有者でなければ拒否する")
        void nonOwnerIsRejected() {
            assertThatThrownBy(() -> empty().requireOwnedBy("user-2"))
                    .isInstanceOf(DomainException.Forbidden.class)
                    .hasMessageContaining("権限がありません");
        }

        @Test
        @DisplayName("所有者なら通る")
        void ownerPasses() {
            empty().requireOwnedBy("user-1");
        }
    }

    @Nested
    @DisplayName("組み立て時の検証")
    class Construction {

        @Test
        @DisplayName("処方箋の名前は必須")
        void nameIsRequired() {
            assertThatThrownBy(
                            () ->
                                    Prescription.reconstitute(
                                            "rx-3", "user-1", "member-1", " ", PRESCRIBED_AT, null,
                                            List.of()))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("名前は必須");
        }

        @Test
        @DisplayName("所有ユーザーは必須")
        void ownerIsRequired() {
            assertThatThrownBy(
                            () ->
                                    Prescription.reconstitute(
                                            "rx-4", null, "member-1", "8月分", PRESCRIBED_AT, null,
                                            List.of()))
                    .isInstanceOf(DomainException.Validation.class);
        }
    }
}
