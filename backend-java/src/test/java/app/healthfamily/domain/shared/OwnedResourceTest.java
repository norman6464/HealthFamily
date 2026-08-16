package app.healthfamily.domain.shared;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 所有権チェックの共通化。
 *
 * <p>アレルギー・通院・病院・検査など、ユーザーに属するだけの資源が多数ある。
 * それぞれに同じ判定を書き写すと、いずれ 1 箇所だけ書き忘れて他人のデータが
 * 見えるようになる。判定を 1 つにまとめて、そこだけを検証する。
 */
@DisplayName("所有資源の共通判定")
class OwnedResourceTest {

    /** 所有者だけを持つ最小の実装 */
    private record Sample(String userId) implements OwnedResource {
        @Override
        public String ownerId() {
            return userId;
        }
    }

    @Test
    @DisplayName("所有者なら通る")
    void ownerPasses() {
        assertThatCode(() -> new Sample("user-1").requireOwnedBy("user-1", "アレルギー"))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("所有者でなければ拒否し、資源名をメッセージに含める")
    void nonOwnerIsRejected() {
        assertThatThrownBy(() -> new Sample("user-1").requireOwnedBy("user-2", "アレルギー"))
                .isInstanceOf(DomainException.Forbidden.class)
                .hasMessageContaining("アレルギー")
                .hasMessageContaining("権限がありません");
    }

    @Test
    @DisplayName("所有者が未設定なら誰のものでもないとして拒否する")
    void nullOwnerIsRejected() {
        assertThatThrownBy(() -> new Sample(null).requireOwnedBy("user-1", "通院"))
                .isInstanceOf(DomainException.Forbidden.class);
    }

    @Test
    @DisplayName("問い合わせ側のIDが空でも通してはいけない")
    void blankCandidateIsRejected() {
        assertThatThrownBy(() -> new Sample("user-1").requireOwnedBy(null, "病院"))
                .isInstanceOf(DomainException.Forbidden.class);
        assertThatThrownBy(() -> new Sample("user-1").requireOwnedBy(" ", "病院"))
                .isInstanceOf(DomainException.Forbidden.class);
    }

    @Test
    @DisplayName("判定だけを取り出せる")
    void canQueryWithoutThrowing() {
        assertThat(new Sample("user-1").ownedBy("user-1")).isTrue();
        assertThat(new Sample("user-1").ownedBy("user-2")).isFalse();
    }
}
