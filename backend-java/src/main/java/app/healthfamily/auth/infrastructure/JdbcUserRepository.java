package app.healthfamily.auth.infrastructure;

import app.healthfamily.auth.domain.User;
import app.healthfamily.auth.domain.UserRepository;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Locale;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** 利用者の JDBC 実装。テーブルは Go 版と共有している。 */
@Repository
public class JdbcUserRepository implements UserRepository {

    private static final String COLUMNS =
            "id, email, password, \"displayName\", \"characterType\", \"googleId\", \"emailVerified\"";

    private final JdbcClient jdbc;

    public JdbcUserRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<User> findByGoogleId(String googleId) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM \"User\" WHERE \"googleId\" = :googleId")
                .param("googleId", googleId)
                .query(JdbcUserRepository::toUser)
                .optional();
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM \"User\" WHERE email = :email")
                .param("email", email.trim().toLowerCase(Locale.ROOT))
                .query(JdbcUserRepository::toUser)
                .optional();
    }

    @Override
    public void create(User user) {
        jdbc.sql(
                        """
                        INSERT INTO "User"
                               (id, email, password, "displayName", "characterType",
                                "googleId", "emailVerified", "updatedAt")
                        VALUES (:id, :email, :password, :displayName, :characterType,
                                :googleId, :emailVerified, now())
                        """)
                .param("id", user.id())
                .param("email", user.email())
                .param("password", user.password())
                .param("displayName", user.displayName().orElse(null))
                .param("characterType", user.characterType())
                .param("googleId", user.googleId().orElse(null))
                .param("emailVerified", user.emailVerified())
                .update();
    }

    @Override
    public void update(User user) {
        jdbc.sql(
                        """
                        UPDATE "User"
                           SET "displayName"   = :displayName,
                               "googleId"      = :googleId,
                               "emailVerified" = :emailVerified,
                               "updatedAt"     = now()
                         WHERE id = :id
                        """)
                .param("displayName", user.displayName().orElse(null))
                .param("googleId", user.googleId().orElse(null))
                .param("emailVerified", user.emailVerified())
                .param("id", user.id())
                .update();
    }

    private static User toUser(ResultSet rs, int rowNum) throws SQLException {
        return User.reconstitute(
                rs.getString("id"),
                rs.getString("email"),
                rs.getString("password"),
                rs.getString("displayName"),
                rs.getString("characterType"),
                rs.getString("googleId"),
                rs.getBoolean("emailVerified"));
    }
}
