package app.healthfamily.infrastructure.auth;

import static org.assertj.core.api.Assertions.assertThat;

import app.healthfamily.domain.auth.GoogleIdentity;
import app.healthfamily.domain.auth.User;
import app.healthfamily.domain.auth.UserRepository;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/** 利用者リポジトリを compose の PostgreSQL に対して検証する。 */
@SpringBootTest
@DisplayName("利用者リポジトリ（jOOQ / 実DB）")
class JooqUserRepositoryIT {

    @Autowired UserRepository repository;
    @Autowired DSLContext dsl;

    @BeforeEach
    void setUp() {
        dsl.execute("TRUNCATE \"MedicationRecord\", \"Medication\", \"Member\", \"User\" CASCADE");
    }

    private static GoogleIdentity identity(String sub, String email) {
        return new GoogleIdentity(sub, email, true, "拓真");
    }

    @Test
    @DisplayName("Google から作った利用者を保存し、googleId で引ける")
    void createAndFindByGoogleId() {
        var created = User.registerFromGoogle("user-1", identity("sub-1", "new@example.com"));

        repository.create(created);
        var found = repository.findByGoogleId("sub-1").orElseThrow();

        assertThat(found.id()).isEqualTo("user-1");
        assertThat(found.email()).isEqualTo("new@example.com");
        assertThat(found.displayName()).contains("拓真");
        assertThat(found.emailVerified()).isTrue();
        assertThat(found.characterType()).isEqualTo("cat");
        assertThat(found.password()).isEqualTo(User.NO_PASSWORD);
    }

    @Test
    @DisplayName("メールアドレスは大文字小文字を無視して引ける")
    void findByEmailIsCaseInsensitive() {
        repository.create(User.registerFromGoogle("user-2", identity("sub-2", "Mixed@Example.COM")));

        assertThat(repository.findByEmail("mixed@example.com")).isPresent();
        assertThat(repository.findByEmail("MIXED@EXAMPLE.COM")).isPresent();
    }

    @Test
    @DisplayName("存在しなければ空を返す")
    void missingReturnsEmpty() {
        assertThat(repository.findByGoogleId("nope")).isEmpty();
        assertThat(repository.findByEmail("nobody@example.com")).isEmpty();
    }

    @Test
    @DisplayName("既存利用者への Google 紐付けを書き戻せる")
    void updatePersistsGoogleLink() {
        dsl.execute(
                """
                INSERT INTO "User" (id, email, password, "emailVerified", "updatedAt")
                VALUES ('user-3', 'existing@example.com', 'hashed', false, now())
                """);
        var existing = repository.findByEmail("existing@example.com").orElseThrow();

        existing.linkGoogle(identity("sub-3", "existing@example.com"));
        repository.update(existing);

        var reloaded = repository.findByGoogleId("sub-3").orElseThrow();
        assertThat(reloaded.id()).isEqualTo("user-3");
        assertThat(reloaded.emailVerified()).isTrue();
        assertThat(reloaded.displayName()).contains("拓真");
        // パスワードは紐付けで消さない。パスワードログインも引き続き使えるべきなので
        assertThat(reloaded.password()).isEqualTo("hashed");
    }
}
