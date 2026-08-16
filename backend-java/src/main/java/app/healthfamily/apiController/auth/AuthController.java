package app.healthfamily.apiController.auth;

import app.healthfamily.usecase.auth.SignInWithGoogleUseCase;
import app.healthfamily.domain.auth.AuthorizationCodeGrant;
import app.healthfamily.domain.auth.User;
import app.healthfamily.apiController.ApiResponse;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 認可コードグラントのコールバックを受ける。
 *
 * <p>ブラウザは Google から認可コードだけを受け取り、それをここへ渡す。
 * <b>ID トークンもリフレッシュトークンもブラウザには渡らない。</b>
 * トークン交換はサーバー間通信で行われる。
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SignInWithGoogleUseCase signInWithGoogle;

    public AuthController(SignInWithGoogleUseCase signInWithGoogle) {
        this.signInWithGoogle = signInWithGoogle;
    }

    @PostMapping("/google/callback")
    public ApiResponse<SignInResponse> googleCallback(
            @jakarta.validation.Valid @RequestBody GoogleCallbackRequest request) {
        var result =
                signInWithGoogle.execute(
                        new AuthorizationCodeGrant(
                                request.code(), request.codeVerifier(), request.redirectUri()));
        return ApiResponse.ok(SignInResponse.of(result));
    }

    /**
     * @param codeVerifier PKCE の合言葉の本体。ブラウザが認可リクエスト前に生成し、
     *     ハッシュだけを Google へ預けてある
     */
    public record GoogleCallbackRequest(
            @NotBlank String code, @NotBlank String codeVerifier, @NotBlank String redirectUri) {}

    public record SignInResponse(String token, UserResponse user) {

        static SignInResponse of(SignInWithGoogleUseCase.Result result) {
            return new SignInResponse(result.accessToken(), UserResponse.of(result.user()));
        }
    }

    public record UserResponse(
            String id, String email, String displayName, String characterType, boolean emailVerified) {

        static UserResponse of(User user) {
            return new UserResponse(
                    user.id(),
                    user.email(),
                    user.displayName().orElse(null),
                    user.characterType(),
                    user.emailVerified());
        }
    }
}
