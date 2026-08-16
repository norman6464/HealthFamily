package app.healthfamily.usecase.auth;

import app.healthfamily.domain.auth.EmailAddress;
import app.healthfamily.domain.auth.PasswordHasher;
import app.healthfamily.domain.auth.RawPassword;
import app.healthfamily.domain.auth.User;
import app.healthfamily.domain.auth.UserRepository;
import app.healthfamily.domain.auth.VerificationCode;
import app.healthfamily.domain.auth.VerificationMailer;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 新規登録。
 *
 * <p>「そのメールアドレスが登録済みか」を呼び出し側に悟らせない。
 * 例外を投げたり応答を変えたりすると、総当たりで利用者の一覧を作れてしまう。
 * 認証済みのアドレスに対しては、何もせず成功したかのように振る舞う。
 *
 * <p>未認証のアドレスに対しては登録内容を差し替えてコードを送り直す。
 * 「登録したがメールを見失った」を救うためだが、認証済みには決して許さない。
 */
@Service
public class SignUpUseCase {

    private final UserRepository users;
    private final PasswordHasher hasher;
    private final VerificationMailer mailer;
    private final Clock clock;

    public SignUpUseCase(
            UserRepository users, PasswordHasher hasher, VerificationMailer mailer, Clock clock) {
        this.users = users;
        this.hasher = hasher;
        this.mailer = mailer;
        this.clock = clock;
    }

    @Transactional
    public void execute(Command command) {
        // 検証は先に済ませる。ここで落ちればメールも DB 書き込みも起きない
        EmailAddress email = EmailAddress.of(command.email());
        RawPassword password = RawPassword.of(command.password());
        String hashed = hasher.hash(password.value());

        var existing = users.findByEmail(email.value());
        if (existing.isPresent()) {
            User user = existing.get();
            if (user.emailVerified()) {
                // 登録済みであることを漏らさない。何もせず正常終了する
                return;
            }
            user.replacePendingRegistration(hashed, command.displayName());
            VerificationCode code = user.issueVerificationCode(clock.instant());
            users.update(user);
            mailer.sendVerificationCode(email.value(), code.value());
            return;
        }

        User created =
                User.registerWithPassword(
                        UUID.randomUUID().toString(), email.value(), hashed, command.displayName());
        VerificationCode code = created.issueVerificationCode(clock.instant());
        users.create(created);
        mailer.sendVerificationCode(email.value(), code.value());
    }

    /** @param displayName 任意。未指定なら既存の表示名を残す */
    public record Command(String email, String password, String displayName) {}
}
