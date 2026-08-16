package app.healthfamily.usecase.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.auth.AccessTokenIssuer;
import app.healthfamily.domain.auth.AuthorizationCodeGrant;
import app.healthfamily.domain.auth.GoogleIdentity;
import app.healthfamily.domain.auth.GoogleTokenExchanger;
import app.healthfamily.domain.auth.User;
import app.healthfamily.domain.auth.UserRepository;
import app.healthfamily.domain.shared.DomainException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Google ログイン（認可コードグラント）")
class SignInWithGoogleUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-08-15T12:00:00Z");
    private static final AuthorizationCodeGrant GRANT =
            new AuthorizationCodeGrant("code-1", "v".repeat(43), "https://app.example/callback");

    /** 交換結果を差し替えられる偽物。HTTP も JWKS も出てこない */
    private static final class StubExchanger implements GoogleTokenExchanger {
        private GoogleIdentity identity;
        private int calls;

        @Override
        public GoogleIdentity exchange(AuthorizationCodeGrant grant) {
            calls++;
            return identity;
        }
    }

    private static final class InMemoryUsers implements UserRepository {
        private final List<User> stored = new ArrayList<>();
        private int creates;
        private int updates;

        @Override
        public Optional<User> findByGoogleId(String googleId) {
            return stored.stream().filter(u -> u.googleId().filter(googleId::equals).isPresent()).findFirst();
        }

        @Override
        public Optional<User> findByEmail(String email) {
            String normalized = email.trim().toLowerCase(Locale.ROOT);
            return stored.stream().filter(u -> u.email().equals(normalized)).findFirst();
        }

        @Override
        public void create(User user) {
            creates++;
            stored.add(user);
        }

        @Override
        public void update(User user) {
            updates++;
        }
    }

    private StubExchanger exchanger;
    private InMemoryUsers users;
    private SignInWithGoogleUseCase useCase;

    @BeforeEach
    void setUp() {
        exchanger = new StubExchanger();
        users = new InMemoryUsers();
        AccessTokenIssuer issuer = (user, now) -> "token-for-" + user.id();
        useCase =
                new SignInWithGoogleUseCase(
                        exchanger, users, issuer, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    @DisplayName("googleId が一致すれば、そのユーザーでログインする")
    void resolvesByGoogleId() {
        var existing =
                User.reconstitute("user-1", "user@example.com", "", "既存", "cat", "sub-1", true);
        users.stored.add(existing);
        exchanger.identity = new GoogleIdentity("sub-1", "user@example.com", true, "Google の名前");

        var result = useCase.execute(GRANT);

        assertThat(result.user().id()).isEqualTo("user-1");
        assertThat(result.accessToken()).isEqualTo("token-for-user-1");
        assertThat(users.creates).isZero();
        assertThat(users.updates).isZero();
    }

    @Test
    @DisplayName("googleId が無くメールが一致すれば、既存アカウントに紐付ける")
    void linksToExistingByEmail() {
        var existing =
                User.reconstitute("user-2", "user@example.com", "hashed", null, "cat", null, false);
        users.stored.add(existing);
        exchanger.identity = new GoogleIdentity("sub-2", "USER@example.com", true, "拓真");

        var result = useCase.execute(GRANT);

        assertThat(result.user().id()).isEqualTo("user-2");
        assertThat(result.user().googleId()).contains("sub-2");
        assertThat(result.user().emailVerified()).isTrue();
        assertThat(users.updates).isEqualTo(1);
        assertThat(users.creates).isZero();
    }

    @Test
    @DisplayName("どちらも無ければ新規作成する")
    void createsNewUser() {
        exchanger.identity = new GoogleIdentity("sub-3", "new@example.com", true, "新規");

        var result = useCase.execute(GRANT);

        assertThat(result.user().email()).isEqualTo("new@example.com");
        assertThat(result.user().googleId()).contains("sub-3");
        assertThat(users.creates).isEqualTo(1);
    }

    @Test
    @DisplayName("メール未確認では、既存アカウントへの紐付けも新規作成もしない")
    void unverifiedEmailCannotLinkOrCreate() {
        users.stored.add(
                User.reconstitute("user-4", "victim@example.com", "hashed", null, "cat", null, true));
        exchanger.identity = new GoogleIdentity("attacker-sub", "victim@example.com", false, null);

        assertThatThrownBy(() -> useCase.execute(GRANT))
                .isInstanceOf(DomainException.Forbidden.class);

        assertThat(users.creates).isZero();
        assertThat(users.updates).isZero();
    }

    @Test
    @DisplayName("すでに別の Google アカウントが紐付いたメールは奪えない")
    void cannotHijackAccountLinkedToAnotherGoogleAccount() {
        users.stored.add(
                User.reconstitute(
                        "user-5", "user@example.com", "", null, "cat", "legit-sub", true));
        exchanger.identity = new GoogleIdentity("attacker-sub", "user@example.com", true, null);

        assertThatThrownBy(() -> useCase.execute(GRANT))
                .isInstanceOf(DomainException.Conflict.class);

        assertThat(users.updates).isZero();
    }

    @Test
    @DisplayName("トークン交換は1回だけ呼ばれる（認可コードは使い捨て）")
    void exchangesExactlyOnce() {
        exchanger.identity = new GoogleIdentity("sub-6", "once@example.com", true, null);

        useCase.execute(GRANT);

        assertThat(exchanger.calls).isEqualTo(1);
    }
}
