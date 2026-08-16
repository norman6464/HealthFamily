package app.healthfamily.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.beans.factory.annotation.Qualifier;

/**
 * API の認可設定。
 *
 * <p>状態を持たない JWT 認証なので、セッションも CSRF トークンも使わない。
 * 認証は Authorization ヘッダの Bearer トークンだけで行う。
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http, @Qualifier("appJwtDecoder") JwtDecoder appJwtDecoder)
            throws Exception {
        return http
                // Cookie を使わないため CSRF の攻撃面がない
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(
                        auth ->
                                auth
                                        // ログイン導線とヘルスチェックのみ認証不要
                                        .requestMatchers("/api/auth/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/actuator/health")
                                        .permitAll()
                                        .anyRequest()
                                        .authenticated())
                .oauth2ResourceServer(
                        oauth2 ->
                                oauth2.jwt(
                                        jwt ->
                                                jwt.decoder(appJwtDecoder)
                                                        .jwtAuthenticationConverter(
                                                                converter())))
                .build();
    }

    /**
     * トークンの主体をユーザーIDにする。
     *
     * <p>Go 版は uid クレームを使っているが、sub にも同じ値が入っているため
     * 標準の sub をそのまま principal 名として扱う。
     */
    private static JwtAuthenticationConverter converter() {
        var converter = new JwtAuthenticationConverter();
        converter.setPrincipalClaimName("sub");
        return converter;
    }
}
