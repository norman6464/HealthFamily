package app.healthfamily.apiController.member;

import static app.healthfamily.infrastructure.jooq.Tables.MEMBER;
import static org.assertj.core.api.Assertions.assertThat;
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

/** メンバーのエンドポイントを実 DB と実トークンで通す。 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(MemberControllerIT.FixedClockConfig.class)
@DisplayName("メンバーエンドポイント（実DB）")
class MemberControllerIT {

    /** 2026-08-16 12:00 UTC = JST 21:00。「今日」は 2026-08-16 */
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
                "TRUNCATE \"PrescriptionItem\", \"Prescription\", \"MedicationRecord\","
                        + " \"Medication\", \"Member\", \"User\" CASCADE");
        dsl.execute(
                """
                INSERT INTO "User" (id, email, password, "updatedAt")
                VALUES ('user-1', 'owner@example.test', '', now()),
                       ('user-2', 'other@example.test', '', now())
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

    @Test
    @DisplayName("人のメンバーを登録できる")
    void createHuman() throws Exception {
        mockMvc.perform(
                        post("/api/members")
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"母","memberType":"human","birthDate":"1960-04-01"}
                                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("母"))
                .andExpect(jsonPath("$.data.memberType").value("human"))
                .andExpect(jsonPath("$.data.age").value(66));

        assertThat(dsl.fetchCount(MEMBER)).isEqualTo(1);
    }

    @Test
    @DisplayName("ペットは動物種別つきで登録できる")
    void createPet() throws Exception {
        mockMvc.perform(
                        post("/api/members")
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"ポチ","memberType":"pet","petType":"dog"}
                                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.petType").value("dog"));
    }

    @Test
    @DisplayName("動物種別の無いペットは 400 で、保存されない")
    void petWithoutPetTypeIsRejected() throws Exception {
        mockMvc.perform(
                        post("/api/members")
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\":\"名無し\",\"memberType\":\"pet\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(
                        org.hamcrest.Matchers.containsString("動物種別は必須")));

        assertThat(dsl.fetchCount(MEMBER)).isZero();
    }

    @Test
    @DisplayName("人に動物種別を付けると 400")
    void humanWithPetTypeIsRejected() throws Exception {
        mockMvc.perform(
                        post("/api/members")
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"name\":\"父\",\"memberType\":\"human\",\"petType\":\"dog\"}"))
                .andExpect(status().isBadRequest());

        assertThat(dsl.fetchCount(MEMBER)).isZero();
    }

    @Test
    @DisplayName("未来の生年月日は 400")
    void futureBirthDateIsRejected() throws Exception {
        mockMvc.perform(
                        post("/api/members")
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"name":"未来人","memberType":"human","birthDate":"2030-01-01"}
                                        """))
                .andExpect(status().isBadRequest());

        assertThat(dsl.fetchCount(MEMBER)).isZero();
    }

    @Test
    @DisplayName("一覧は自分のメンバーだけを返す")
    void listIsScopedToOwner() throws Exception {
        mockMvc.perform(
                post("/api/members")
                        .header(HttpHeaders.AUTHORIZATION, bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"自分の家族\",\"memberType\":\"human\"}"));
        mockMvc.perform(
                post("/api/members")
                        .header(HttpHeaders.AUTHORIZATION, otherBearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"他人の家族\",\"memberType\":\"human\"}"));

        mockMvc.perform(get("/api/members").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].name").value("自分の家族"));
    }

    @Test
    @DisplayName("他人のメンバーは個別取得できない")
    void otherUsersMemberIsForbidden() throws Exception {
        var body =
                mockMvc.perform(
                                post("/api/members")
                                        .header(HttpHeaders.AUTHORIZATION, bearer)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{\"name\":\"本人\",\"memberType\":\"human\"}"))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        String id = body.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/members/" + id).header(HttpHeaders.AUTHORIZATION, otherBearer))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("トークン無しでは 401")
    void withoutTokenIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/members")).andExpect(status().isUnauthorized());
    }
}
