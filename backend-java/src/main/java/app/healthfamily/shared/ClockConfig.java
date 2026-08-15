package app.healthfamily.shared;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 時刻の供給元。
 *
 * <p>ドメインとユースケースは {@code Instant.now()} を直接呼ばず、この Clock から受け取る。
 * テストで固定時刻に差し替えられるようにするため。
 * フロントの computeIsLowStock が端末の時計に依存していた問題を、
 * バックエンドでは最初から避けておく。
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
