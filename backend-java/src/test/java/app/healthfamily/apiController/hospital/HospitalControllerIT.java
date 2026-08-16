package app.healthfamily.apiController.hospital;

import static app.healthfamily.infrastructure.jooq.Tables.HOSPITAL;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import app.healthfamily.domain.auth.AccessTokenIssuer;
import app.healthfamily.domain.auth.User;
import java.time.Instant;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** 病院エンドポイントを実 DB と実トークンで通す。共通CRUDが権限で守られていることの確認を兼ねる。 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("病院エンドポイント（実DB）")
class HospitalControllerIT {

    private static final Instant NOW = Instant.parse("2026-08-16T12:00:00Z");

    @Autowired MockMvc mockMvc;
    @Autowired DSLContext dsl;
    @Autowired AccessTokenIssuer tokens;

    private String bearer;
    private String otherBearer;

    @BeforeEach
    void setUp() {
        dsl.execute("TRUNCATE \"Appointment\", \"Hospital\", \"Member\", \"User\" CASCADE");
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

    private String createHospital(String token, String name) throws Exception {
        var body =
                mockMvc.perform(
                                post("/api/hospitals")
                                        .header(HttpHeaders.AUTHORIZATION, token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{\"name\":\"" + name + "\",\"department\":\"内科\"}"))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        return body.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");
    }

    @Test
    @DisplayName("登録して一覧に出る")
    void createAndList() throws Exception {
        createHospital(bearer, "かかりつけ医");

        mockMvc.perform(get("/api/hospitals").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].name").value("かかりつけ医"));
    }

    @Test
    @DisplayName("一覧は自分のものだけ")
    void listIsScoped() throws Exception {
        createHospital(bearer, "自分の病院");
        createHospital(otherBearer, "他人の病院");

        mockMvc.perform(get("/api/hospitals").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].name").value("自分の病院"));
    }

    @Test
    @DisplayName("名前は必須")
    void nameIsRequired() throws Exception {
        mockMvc.perform(
                        post("/api/hospitals")
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\":\" \"}"))
                .andExpect(status().isBadRequest());

        assertThat(dsl.fetchCount(HOSPITAL)).isZero();
    }

    @Test
    @DisplayName("他人の病院は取得できない")
    void otherGetIsForbidden() throws Exception {
        String id = createHospital(otherBearer, "他人の病院");

        mockMvc.perform(get("/api/hospitals/" + id).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("他人の病院は更新できず、値も変わらない")
    void otherUpdateIsForbidden() throws Exception {
        String id = createHospital(otherBearer, "他人の病院");

        mockMvc.perform(
                        patch("/api/hospitals/" + id)
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\":\"乗っ取り\"}"))
                .andExpect(status().isForbidden());

        assertThat(dsl.select(HOSPITAL.NAME).from(HOSPITAL).where(HOSPITAL.ID.eq(id)).fetchSingle(HOSPITAL.NAME))
                .isEqualTo("他人の病院");
    }

    @Test
    @DisplayName("他人の病院は削除できず、残る")
    void otherDeleteIsForbidden() throws Exception {
        String id = createHospital(otherBearer, "他人の病院");

        mockMvc.perform(delete("/api/hospitals/" + id).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isForbidden());

        assertThat(dsl.fetchCount(HOSPITAL, HOSPITAL.ID.eq(id))).isEqualTo(1);
    }

    @Test
    @DisplayName("自分の病院は更新できる")
    void ownUpdateSucceeds() throws Exception {
        String id = createHospital(bearer, "旧名");

        mockMvc.perform(
                        patch("/api/hospitals/" + id)
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"name\":\"新名\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("新名"));
    }

    @Test
    @DisplayName("自分の病院は削除できる")
    void ownDeleteSucceeds() throws Exception {
        String id = createHospital(bearer, "閉院した病院");

        mockMvc.perform(delete("/api/hospitals/" + id).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isNoContent());

        assertThat(dsl.fetchCount(HOSPITAL)).isZero();
    }

    @Test
    @DisplayName("存在しない病院は 404")
    void missingIsNotFound() throws Exception {
        mockMvc.perform(get("/api/hospitals/nope").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("トークン無しでは 401")
    void withoutTokenIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/hospitals")).andExpect(status().isUnauthorized());
    }
}
