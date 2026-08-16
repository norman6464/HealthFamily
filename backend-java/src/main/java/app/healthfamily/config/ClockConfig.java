package app.healthfamily.config;

import app.healthfamily.domain.shared.AppZone;
import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 時刻に関する組み立て。
 *
 * <p>ドメインとユースケースは {@code Instant.now()} を直接呼ばず、この Clock から受け取る。
 * テストで固定時刻に差し替えられるようにするため。
 *
 * <p>ドメイン層の {@link AppZone} はフレームワークに依存しないため、
 * Bean 化はここ（外側）で行う。
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    public AppZone appZone(Clock clock) {
        return new AppZone(clock);
    }
}
