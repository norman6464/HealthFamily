package app.healthfamily.auth.application;

import app.healthfamily.auth.domain.AccessTokenIssuer;
import app.healthfamily.auth.domain.AuthorizationCodeGrant;
import app.healthfamily.auth.domain.GoogleIdentity;
import app.healthfamily.auth.domain.GoogleTokenExchanger;
import app.healthfamily.auth.domain.User;
import app.healthfamily.auth.domain.UserRepository;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 認可コードグラントで Google ログインを完了させるユースケース。
 *
 * <p>アカウントの解決順は 3 段階で、Go 版と揃えている。
 *
 * <ol>
 *   <li><b>googleId 一致</b>：すでに紐付け済み。そのままログイン</li>
 *   <li><b>メール一致</b>：パスワード登録済みのユーザーに Google を紐付ける</li>
 *   <li><b>どちらも無い</b>：新規作成</li>
 * </ol>
 *
 * <p>2 と 3 は Google 側でメールの所有確認が済んでいる場合にのみ許可する。
 * 未確認のメールで紐付けを許すと、他人のメールアドレスを名乗って
 * 既存アカウントを乗っ取れてしまう。
 */
@Service
public class SignInWithGoogleUseCase {

    private final GoogleTokenExchanger exchanger;
    private final UserRepository users;
    private final AccessTokenIssuer tokens;
    private final Clock clock;

    public SignInWithGoogleUseCase(
            GoogleTokenExchanger exchanger,
            UserRepository users,
            AccessTokenIssuer tokens,
            Clock clock) {
        this.exchanger = exchanger;
        this.users = users;
        this.tokens = tokens;
        this.clock = clock;
    }

    @Transactional
    public Result execute(AuthorizationCodeGrant grant) {
        GoogleIdentity identity = exchanger.exchange(grant);
        User user = resolve(identity);
        return new Result(tokens.issue(user, clock.instant()), user);
    }

    private User resolve(GoogleIdentity identity) {
        var linked = users.findByGoogleId(identity.subject());
        if (linked.isPresent()) {
            return linked.get();
        }

        identity.requireVerifiedEmail();

        var byEmail = users.findByEmail(identity.email());
        if (byEmail.isPresent()) {
            User existing = byEmail.get();
            existing.linkGoogle(identity);
            users.update(existing);
            return existing;
        }

        User created = User.registerFromGoogle(UUID.randomUUID().toString(), identity);
        users.create(created);
        return created;
    }

    public record Result(String accessToken, User user) {}
}
