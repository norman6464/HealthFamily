package app.healthfamily.usecase.crud;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * 所有者を持つだけの資源に共通する読み書きの手順。
 *
 * <p>病院・アレルギー・保険・緊急連絡先など、ドメイン規則が所有権チェックしかない資源が
 * 多数ある。同じ手順を資源ごとに書き写すと、いずれ 1 箇所だけ所有権チェックを
 * 書き忘れて他人のデータが操作できるようになる。手順を 1 つにまとめて、そこを検証する。
 */
@DisplayName("所有資源の共通CRUD")
class OwnedCrudUseCaseTest {

    private record Item(String id, String userId, String name) implements OwnedResource {
        @Override
        public String ownerId() {
            return userId;
        }
    }

    /** 所有者で絞り込まない、素朴な保管庫。絞り込みはユースケース側の責任として検証する */
    private static final class InMemoryStore implements OwnedCrudRepository<Item> {
        private final List<Item> items = new ArrayList<>();

        @Override
        public Optional<Item> findById(String id) {
            return items.stream().filter(i -> i.id().equals(id)).findFirst();
        }

        @Override
        public List<Item> listByUser(String userId) {
            return items.stream().filter(i -> i.userId().equals(userId)).toList();
        }

        @Override
        public void save(Item entity) {
            items.removeIf(i -> i.id().equals(entity.id()));
            items.add(entity);
        }

        @Override
        public void deleteById(String id) {
            items.removeIf(i -> i.id().equals(id));
        }
    }

    private InMemoryStore store;
    private OwnedCrudUseCase<Item> useCase;

    @BeforeEach
    void setUp() {
        store = new InMemoryStore();
        useCase = new OwnedCrudUseCase<>(store, "病院");
        store.save(new Item("i-1", "user-1", "自分の病院"));
        store.save(new Item("i-2", "user-2", "他人の病院"));
    }

    @Nested
    @DisplayName("参照")
    class Read {

        @Test
        @DisplayName("一覧は自分のものだけ")
        void listIsScoped() {
            assertThat(useCase.list("user-1")).extracting(Item::id).containsExactly("i-1");
        }

        @Test
        @DisplayName("自分のものは取得できる")
        void ownGetSucceeds() {
            assertThat(useCase.get("user-1", "i-1").name()).isEqualTo("自分の病院");
        }

        @Test
        @DisplayName("他人のものは取得できない")
        void otherGetIsForbidden() {
            assertThatThrownBy(() -> useCase.get("user-1", "i-2"))
                    .isInstanceOf(DomainException.Forbidden.class)
                    .hasMessageContaining("病院");
        }

        @Test
        @DisplayName("存在しないものは見つからない")
        void missingIsNotFound() {
            assertThatThrownBy(() -> useCase.get("user-1", "nope"))
                    .isInstanceOf(DomainException.NotFound.class)
                    .hasMessageContaining("病院");
        }
    }

    @Nested
    @DisplayName("更新")
    class Update {

        @Test
        @DisplayName("自分のものは更新できる")
        void ownUpdateSucceeds() {
            useCase.update("user-1", "i-1", existing -> new Item(existing.id(), existing.userId(), "改名"));

            assertThat(store.findById("i-1").orElseThrow().name()).isEqualTo("改名");
        }

        @Test
        @DisplayName("他人のものは更新できず、値も変わらない")
        void otherUpdateIsForbidden() {
            assertThatThrownBy(
                            () ->
                                    useCase.update(
                                            "user-1",
                                            "i-2",
                                            existing -> new Item(existing.id(), existing.userId(), "乗っ取り")))
                    .isInstanceOf(DomainException.Forbidden.class);

            assertThat(store.findById("i-2").orElseThrow().name()).isEqualTo("他人の病院");
        }

        @Test
        @DisplayName("所有者を書き換えようとしても拒否する")
        void cannotReassignOwner() {
            assertThatThrownBy(
                            () ->
                                    useCase.update(
                                            "user-1", "i-1", existing -> new Item(existing.id(), "user-2", "移譲")))
                    .isInstanceOf(DomainException.Forbidden.class)
                    .hasMessageContaining("所有者");

            assertThat(store.findById("i-1").orElseThrow().userId()).isEqualTo("user-1");
        }
    }

    @Nested
    @DisplayName("削除")
    class Delete {

        @Test
        @DisplayName("自分のものは削除できる")
        void ownDeleteSucceeds() {
            useCase.delete("user-1", "i-1");

            assertThat(store.findById("i-1")).isEmpty();
        }

        @Test
        @DisplayName("他人のものは削除できず、残る")
        void otherDeleteIsForbidden() {
            assertThatThrownBy(() -> useCase.delete("user-1", "i-2"))
                    .isInstanceOf(DomainException.Forbidden.class);

            assertThat(store.findById("i-2")).isPresent();
        }

        @Test
        @DisplayName("存在しないものの削除は見つからない扱い")
        void missingDeleteIsNotFound() {
            assertThatThrownBy(() -> useCase.delete("user-1", "nope"))
                    .isInstanceOf(DomainException.NotFound.class);
        }
    }

    @Nested
    @DisplayName("作成")
    class Create {

        @Test
        @DisplayName("所有者が呼び出し元と一致していれば作成できる")
        void createSucceeds() {
            useCase.create("user-1", new Item("i-3", "user-1", "新しい病院"));

            assertThat(store.findById("i-3")).isPresent();
        }

        @Test
        @DisplayName("他人を所有者にした作成は拒否する")
        void createForOtherUserIsRejected() {
            assertThatThrownBy(() -> useCase.create("user-1", new Item("i-4", "user-2", "なりすまし")))
                    .isInstanceOf(DomainException.Forbidden.class);

            assertThat(store.findById("i-4")).isEmpty();
        }
    }
}
