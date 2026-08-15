package app.healthfamily;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * 統合テストで共有する PostgreSQL。
 *
 * <p>{@code @ServiceConnection} を付けると Spring Boot が接続情報を自動で流し込むため、
 * テストごとに DynamicPropertySource を書く必要がない。
 *
 * <p>初期スキーマは実 DB から pg_dump で切り出したもの。
 * 手書きすると本番との差異に気づけないため、必ず実物から起こす。
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    @SuppressWarnings("resource")
    PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>("postgres:17").withInitScript("db/medication-schema.sql");
    }
}
