package app.healthfamily.apiController.healthrecord;

import static app.healthfamily.infrastructure.jooq.Tables.TEMPERATURERECORD;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import app.healthfamily.domain.auth.AccessTokenIssuer;
import app.healthfamily.domain.auth.User;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 体温・体格・ワクチンのエンドポイント。
 *
 * <p>これらは値オブジェクトに検証規則を持たせてある。エンドポイント越しでも
 * その規則が効いていることを確かめる。
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(HealthRecordControllerIT.FixedClockConfig.class)
@DisplayName("健康記録エンドポイント（実DB）")
class HealthRecordControllerIT {

    private static final Instant NOW = Instant.parse("2026-08-16T12:00:00Z");

    @TestConfiguration
    static class FixedClockConfig {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(NOW, ZoneOffset.UTC);
        }
    }

    @Autowired MockMvc mockMvc;
    @Autowired DSLContext dsl;
    @Autowired AccessTokenIssuer tokens;

    private String bearer;
    private String otherBearer;

    @BeforeEach
    void setUp() {
        dsl.execute(
                "TRUNCATE \"TemperatureRecord\", \"BodyMeasurement\", \"Vaccination\","
                        + " \"Member\", \"User\" CASCADE");
        dsl.execute(
                """
                INSERT INTO "User" (id, email, password, "updatedAt")
                VALUES ('user-1', 'owner@example.test', '', now()),
                       ('user-2', 'other@example.test', '', now())
                """);
        dsl.execute(
                """
                INSERT INTO "Member" (id, "userId", name, "memberType", "updatedAt")
                VALUES ('member-1', 'user-1', '本人', 'human', now()),
                       ('member-2', 'user-2', '他人', 'human', now())
                """);
        bearer = bearerFor("user-1");
        otherBearer = bearerFor("user-2");
    }

    private String bearerFor(String userId) {
        return "Bearer "
                + tokens.issue(
                        User.reconstitute(userId, userId + "@example.test", "", null, "cat", null, true),
                        NOW);
    }

    @Nested
    @DisplayName("体温")
    class Temperature {

        @Test
        @DisplayName("記録すると発熱の段階が付く")
        void recordsWithFeverLevel() throws Exception {
            mockMvc.perform(
                            post("/api/temperature-records")
                                    .header(HttpHeaders.AUTHORIZATION, bearer)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(
                                            """
                                            {"memberId":"member-1","temperature":38.2,
                                             "measuredAt":"2026-08-16T09:00:00Z"}
                                            """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.temperature").value(38.2))
                    .andExpect(jsonPath("$.data.feverLevel").value("FEVER"));

            assertThat(dsl.fetchCount(TEMPERATURERECORD)).isEqualTo(1);
        }

        @Test
        @DisplayName("ありえない体温は 400 で、保存されない")
        void impossibleTemperatureIsRejected() throws Exception {
            mockMvc.perform(
                            post("/api/temperature-records")
                                    .header(HttpHeaders.AUTHORIZATION, bearer)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(
                                            """
                                            {"memberId":"member-1","temperature":365,
                                             "measuredAt":"2026-08-16T09:00:00Z"}
                                            """))
                    .andExpect(status().isBadRequest());

            assertThat(dsl.fetchCount(TEMPERATURERECORD)).isZero();
        }

        @Test
        @DisplayName("他人のメンバーには記録できない")
        void cannotRecordForOtherUsersMember() throws Exception {
            mockMvc.perform(
                            post("/api/temperature-records")
                                    .header(HttpHeaders.AUTHORIZATION, bearer)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(
                                            """
                                            {"memberId":"member-2","temperature":36.5,
                                             "measuredAt":"2026-08-16T09:00:00Z"}
                                            """))
                    .andExpect(status().isForbidden());

            assertThat(dsl.fetchCount(TEMPERATURERECORD)).isZero();
        }

        @Test
        @DisplayName("一覧は自分のものだけ")
        void listIsScoped() throws Exception {
            mockMvc.perform(
                    post("/api/temperature-records")
                            .header(HttpHeaders.AUTHORIZATION, bearer)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(
                                    """
                                    {"memberId":"member-1","temperature":36.5,
                                     "measuredAt":"2026-08-16T09:00:00Z"}
                                    """));

            mockMvc.perform(get("/api/temperature-records").header(HttpHeaders.AUTHORIZATION, otherBearer))
                    .andExpect(jsonPath("$.data.length()").value(0));
        }
    }

    @Nested
    @DisplayName("体格")
    class Measurement {

        @Test
        @DisplayName("身長と体重を記録すると BMI が返る")
        void recordsWithBmi() throws Exception {
            mockMvc.perform(
                            post("/api/body-measurements")
                                    .header(HttpHeaders.AUTHORIZATION, bearer)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(
                                            """
                                            {"memberId":"member-1","weight":60.0,"height":170.0,
                                             "recordedAt":"2026-08-16T09:00:00Z"}
                                            """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.bmi").value(20.8));
        }

        @Test
        @DisplayName("体重も身長も無ければ 400")
        void emptyMeasurementIsRejected() throws Exception {
            mockMvc.perform(
                            post("/api/body-measurements")
                                    .header(HttpHeaders.AUTHORIZATION, bearer)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(
                                            """
                                            {"memberId":"member-1","recordedAt":"2026-08-16T09:00:00Z"}
                                            """))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("ワクチン")
    class Vaccination {

        @Test
        @DisplayName("次回予定日が近いと通知対象になる")
        void nextDateSoonNeedsReminder() throws Exception {
            mockMvc.perform(
                            post("/api/vaccinations")
                                    .header(HttpHeaders.AUTHORIZATION, bearer)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(
                                            """
                                            {"memberId":"member-1","vaccineName":"狂犬病",
                                             "vaccinatedAt":"2026-01-10T00:00:00Z",
                                             "nextScheduledDate":"2026-08-20T00:00:00Z"}
                                            """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.needsReminder").value(true))
                    .andExpect(jsonPath("$.data.daysUntilNext").value(4));
        }

        @Test
        @DisplayName("次回予定日が接種日より前なら 400")
        void nextBeforeVaccinatedIsRejected() throws Exception {
            mockMvc.perform(
                            post("/api/vaccinations")
                                    .header(HttpHeaders.AUTHORIZATION, bearer)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(
                                            """
                                            {"memberId":"member-1","vaccineName":"狂犬病",
                                             "vaccinatedAt":"2026-06-01T00:00:00Z",
                                             "nextScheduledDate":"2026-05-01T00:00:00Z"}
                                            """))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("削除できる")
        void canDelete() throws Exception {
            var body =
                    mockMvc.perform(
                                    post("/api/vaccinations")
                                            .header(HttpHeaders.AUTHORIZATION, bearer)
                                            .contentType(MediaType.APPLICATION_JSON)
                                            .content(
                                                    """
                                                    {"memberId":"member-1","vaccineName":"混合",
                                                     "vaccinatedAt":"2026-01-10T00:00:00Z"}
                                                    """))
                            .andReturn()
                            .getResponse()
                            .getContentAsString();
            String id = body.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

            mockMvc.perform(delete("/api/vaccinations/" + id).header(HttpHeaders.AUTHORIZATION, bearer))
                    .andExpect(status().isNoContent());

            mockMvc.perform(get("/api/vaccinations").header(HttpHeaders.AUTHORIZATION, bearer))
                    .andExpect(jsonPath("$.data.length()").value(0));
        }
    }
}
