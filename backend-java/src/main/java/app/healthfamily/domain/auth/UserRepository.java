package app.healthfamily.domain.auth;

import java.util.Optional;

/** 利用者の永続化ポート。 */
public interface UserRepository {

    Optional<User> findByGoogleId(String googleId);

    Optional<User> findByEmail(String email);

    void create(User user);

    void update(User user);
}
