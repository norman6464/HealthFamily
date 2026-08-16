package app.healthfamily.domain.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.shared.DomainException;
import java.time.Duration;
import java.time.Instant;
import java.util.stream.IntStream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * メール認証・パスワード再設定に使う 6 桁コード。
 *
 * <p>Go 版はここに複数の穴があった。移植でそのまま持ち込まないよう、
 * 満たすべき性質をテストで固定する。
 */
@DisplayName("認証コード")
class VerificationCodeTest {

    private static final Instant NOW = Instant.parse("2026-08-16T12:00:00Z");

    @Nested
    @DisplayName("生成")
    class Generation {

        @Test
        @DisplayName("6桁の数字になる")
        void isSixDigits() {
            assertThat(VerificationCode.issue(NOW).value()).matches("^[0-9]{6}$");
        }

        @Test
        @DisplayName("有効期限は10分後")
        void expiresInTenMinutes() {
            assertThat(VerificationCode.issue(NOW).expiresAt())
                    .isEqualTo(NOW.plus(Duration.ofMinutes(10)));
        }

        @Test
        @DisplayName("毎回異なる値になる。予測できてはならない")
        void isUnpredictable() {
            var values = IntStream.range(0, 200)
                    .mapToObj(i -> VerificationCode.issue(NOW).value())
                    .distinct()
                    .count();

            // 100万通りから200個引いて、ほぼ全部異なるはず
            assertThat(values).isGreaterThan(190);
        }
    }

    @Nested
    @DisplayName("照合")
    class Matching {

        @Test
        @DisplayName("同じコードで期限内なら一致する")
        void matchesWithinExpiry() {
            var code = VerificationCode.issue(NOW);

            assertThat(code.matches(code.value(), NOW.plus(Duration.ofMinutes(9)))).isTrue();
        }

        @Test
        @DisplayName("期限を過ぎたら一致しない")
        void doesNotMatchAfterExpiry() {
            var code = VerificationCode.issue(NOW);

            assertThat(code.matches(code.value(), NOW.plus(Duration.ofMinutes(11)))).isFalse();
        }

        @Test
        @DisplayName("期限ちょうどはまだ有効")
        void exactlyAtExpiryIsValid() {
            var code = VerificationCode.issue(NOW);

            assertThat(code.matches(code.value(), code.expiresAt())).isTrue();
        }

        @Test
        @DisplayName("違うコードは一致しない")
        void doesNotMatchDifferentCode() {
            var code = VerificationCode.issue(NOW);
            String wrong = code.value().equals("000000") ? "111111" : "000000";

            assertThat(code.matches(wrong, NOW)).isFalse();
        }

        @Test
        @DisplayName("null や空文字は一致しない")
        void doesNotMatchBlank() {
            var code = VerificationCode.issue(NOW);

            assertThat(code.matches(null, NOW)).isFalse();
            assertThat(code.matches("", NOW)).isFalse();
        }

        @Test
        @DisplayName("長さが違っても比較で落ちない")
        void handlesDifferentLength() {
            var code = VerificationCode.issue(NOW);

            assertThat(code.matches("1", NOW)).isFalse();
            assertThat(code.matches("1234567890", NOW)).isFalse();
        }
    }

    @Nested
    @DisplayName("再構築")
    class Reconstitution {

        @Test
        @DisplayName("保存済みの値から復元できる")
        void fromStored() {
            var code = VerificationCode.reconstitute("123456", NOW.plus(Duration.ofMinutes(5)));

            assertThat(code.matches("123456", NOW)).isTrue();
        }

        @Test
        @DisplayName("6桁の数字でない値は復元できない")
        void invalidFormatIsRejected() {
            assertThatThrownBy(() -> VerificationCode.reconstitute("abc", NOW))
                    .isInstanceOf(DomainException.Validation.class);
            assertThatThrownBy(() -> VerificationCode.reconstitute("12345", NOW))
                    .isInstanceOf(DomainException.Validation.class);
        }

        @Test
        @DisplayName("有効期限は必須")
        void expiryIsRequired() {
            assertThatThrownBy(() -> VerificationCode.reconstitute("123456", null))
                    .isInstanceOf(DomainException.Validation.class);
        }
    }
}
