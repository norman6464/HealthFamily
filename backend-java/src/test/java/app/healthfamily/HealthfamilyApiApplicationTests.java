package app.healthfamily;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/** アプリケーションコンテキストが実 DB 付きで起動することの煙テスト。 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class HealthfamilyApiApplicationTests {

    @Test
    @DisplayName("コンテキストが起動する")
    void contextLoads() {}
}
