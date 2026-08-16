package app.healthfamily.infrastructure.auth;

import static app.healthfamily.infrastructure.jooq.Tables.USER;

import app.healthfamily.domain.auth.User;
import app.healthfamily.domain.auth.UserRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.Optional;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

/** 利用者の永続化（jOOQ）。テーブルは Go 版と共有している。 */
@Repository
public class JooqUserRepository implements UserRepository {

    private final DSLContext dsl;

    public JooqUserRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Optional<User> findByGoogleId(String googleId) {
        return dsl.select()
                .from(USER)
                .where(USER.GOOGLEID.eq(googleId))
                .fetchOptional()
                .map(JooqUserRepository::toUser);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return dsl.select()
                .from(USER)
                .where(USER.EMAIL.eq(email.trim().toLowerCase(Locale.ROOT)))
                .fetchOptional()
                .map(JooqUserRepository::toUser);
    }

    @Override
    public void create(User user) {
        dsl.insertInto(USER)
                .set(USER.ID, user.id())
                .set(USER.EMAIL, user.email())
                .set(USER.PASSWORD, user.password())
                .set(USER.DISPLAYNAME, user.displayName().orElse(null))
                .set(USER.CHARACTERTYPE, user.characterType())
                .set(USER.GOOGLEID, user.googleId().orElse(null))
                .set(USER.EMAILVERIFIED, user.emailVerified())
                .set(USER.UPDATEDAT, OffsetDateTime.now(ZoneOffset.UTC))
                .execute();
    }

    /**
     * 紐付けで変わりうる項目だけを書き戻す。
     *
     * <p>パスワード列は触らない。Google を紐付けてもパスワードログインは
     * 引き続き使えるべきで、ここで消すと利用者の別の認証手段を奪ってしまう。
     */
    @Override
    public void update(User user) {
        dsl.update(USER)
                .set(USER.DISPLAYNAME, user.displayName().orElse(null))
                .set(USER.GOOGLEID, user.googleId().orElse(null))
                .set(USER.EMAILVERIFIED, user.emailVerified())
                .set(USER.UPDATEDAT, OffsetDateTime.now(ZoneOffset.UTC))
                .where(USER.ID.eq(user.id()))
                .execute();
    }

    private static User toUser(Record row) {
        return User.reconstitute(
                row.get(USER.ID),
                row.get(USER.EMAIL),
                row.get(USER.PASSWORD),
                row.get(USER.DISPLAYNAME),
                row.get(USER.CHARACTERTYPE),
                row.get(USER.GOOGLEID),
                Boolean.TRUE.equals(row.get(USER.EMAILVERIFIED)));
    }
}
