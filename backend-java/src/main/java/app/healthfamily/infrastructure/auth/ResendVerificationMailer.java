package app.healthfamily.infrastructure.auth;

import app.healthfamily.domain.auth.VerificationMailer;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Resend でメールを送る。
 *
 * <p>API キーが未設定なら送信せず、その旨を警告として残す。
 * Go 版は情報ログを出すだけで成功扱いにしていたため、本番でキーを設定し忘れると
 * 「登録は通るのにコードが誰にも届かない」状態に気づけなかった。
 * ここでは警告にして、気づける形にしている。
 */
@Component
public class ResendVerificationMailer implements VerificationMailer {

    private static final Logger log = LoggerFactory.getLogger(ResendVerificationMailer.class);
    private static final String ENDPOINT = "https://api.resend.com/emails";

    private final RestClient restClient;
    private final String apiKey;
    private final String from;

    public ResendVerificationMailer(
            @Value("${healthfamily.mail.resend-api-key:}") String apiKey,
            @Value("${healthfamily.mail.from:HealthFamily <onboarding@resend.dev>}") String from) {
        this.apiKey = apiKey;
        this.from = from;
        this.restClient = RestClient.create();
    }

    @Override
    public void sendVerificationCode(String to, String code) {
        send(to, "HealthFamily 認証コード",
                "認証コードは %s です。10分以内に入力してください。".formatted(code));
    }

    @Override
    public void sendPasswordResetCode(String to, String code) {
        send(to, "HealthFamily パスワード再設定",
                "再設定コードは %s です。10分以内に入力してください。".formatted(code));
    }

    private void send(String to, String subject, String text) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("メール送信の API キーが未設定のため送信をスキップしました: 宛先={} 件名={}", to, subject);
            return;
        }
        try {
            restClient
                    .post()
                    .uri(ENDPOINT)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("from", from, "to", new String[] {to}, "subject", subject, "text", text))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            // 宛先やコードは残さない。ログから認証コードが漏れないようにする
            log.error("メール送信に失敗しました: 件名={}", subject, e);
            throw e;
        }
    }
}
