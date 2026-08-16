package app.healthfamily.apiController.memberrecord;

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
import java.util.stream.Stream;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * メンバーに紐づく記録の共通挙動を、全リソースまとめて検証する。
 *
 * <p>資源が増えるたびに同じテストを書き写すと、いずれ 1 つだけ
 * 権限のテストが抜ける。パラメータ化して同じ観点を必ず全資源に当てる。
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("メンバー記録の共通CRUD（実DB）")
class MemberScopedCrudIT {

    private static final Instant NOW = Instant.parse("2026-08-16T12:00:00Z");

    @Autowired MockMvc mockMvc;
    @Autowired DSLContext dsl;
    @Autowired AccessTokenIssuer tokens;

    private String bearer;
    private String otherBearer;

    /** 資源ごとの「作成に必要な最小の本文」と「更新で変える項目」 */
    static Stream<Arguments> resources() {
        return Stream.of(
                Arguments.of(
                        "allergies",
                        "{\"memberId\":\"member-1\",\"allergenName\":\"卵\",\"allergyType\":\"food\",\"severity\":\"mild\"}",
                        "{\"allergenName\":\"そば\"}",
                        "allergenName",
                        "そば"),
                Arguments.of(
                        "emergency-contacts",
                        "{\"memberId\":\"member-1\",\"contactName\":\"父\",\"phoneNumber\":\"090-0000-0000\"}",
                        "{\"contactName\":\"母\"}",
                        "contactName",
                        "母"),
                Arguments.of(
                        "insurances",
                        "{\"memberId\":\"member-1\",\"insuranceType\":\"health\",\"providerName\":\"協会けんぽ\"}",
                        "{\"providerName\":\"組合健保\"}",
                        "providerName",
                        "組合健保"));
    }

    @BeforeEach
    void setUp() {
        dsl.execute(
                "TRUNCATE \"Allergy\", \"EmergencyContact\", \"Insurance\","
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

    private String create(String path, String token, String body) throws Exception {
        var response =
                mockMvc.perform(
                                post("/api/" + path)
                                        .header(HttpHeaders.AUTHORIZATION, token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(body))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        return response.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");
    }

    @ParameterizedTest(name = "{0}: 登録して一覧に出る")
    @MethodSource("resources")
    void createAndList(String path, String body, String patchBody, String field, String updated)
            throws Exception {
        create(path, bearer, body);

        mockMvc.perform(get("/api/" + path).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @ParameterizedTest(name = "{0}: 一覧は自分のものだけ")
    @MethodSource("resources")
    void listIsScoped(String path, String body, String patchBody, String field, String updated)
            throws Exception {
        create(path, bearer, body);
        create(path, otherBearer, body.replace("member-1", "member-2"));

        mockMvc.perform(get("/api/" + path).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @ParameterizedTest(name = "{0}: 他人のものは取得できない")
    @MethodSource("resources")
    void otherGetIsForbidden(String path, String body, String patchBody, String field, String updated)
            throws Exception {
        String id = create(path, otherBearer, body.replace("member-1", "member-2"));

        mockMvc.perform(get("/api/" + path + "/" + id).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest(name = "{0}: 他人のものは更新できない")
    @MethodSource("resources")
    void otherUpdateIsForbidden(
            String path, String body, String patchBody, String field, String updated) throws Exception {
        String id = create(path, otherBearer, body.replace("member-1", "member-2"));

        mockMvc.perform(
                        patch("/api/" + path + "/" + id)
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(patchBody))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest(name = "{0}: 他人のものは削除できない")
    @MethodSource("resources")
    void otherDeleteIsForbidden(
            String path, String body, String patchBody, String field, String updated) throws Exception {
        String id = create(path, otherBearer, body.replace("member-1", "member-2"));

        mockMvc.perform(delete("/api/" + path + "/" + id).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/" + path + "/" + id).header(HttpHeaders.AUTHORIZATION, otherBearer))
                .andExpect(status().isOk());
    }

    @ParameterizedTest(name = "{0}: 自分のものは更新できる")
    @MethodSource("resources")
    void ownUpdateSucceeds(String path, String body, String patchBody, String field, String updated)
            throws Exception {
        String id = create(path, bearer, body);

        mockMvc.perform(
                        patch("/api/" + path + "/" + id)
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(patchBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data." + field).value(updated));
    }

    @ParameterizedTest(name = "{0}: 自分のものは削除できる")
    @MethodSource("resources")
    void ownDeleteSucceeds(String path, String body, String patchBody, String field, String updated)
            throws Exception {
        String id = create(path, bearer, body);

        mockMvc.perform(delete("/api/" + path + "/" + id).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/" + path).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @ParameterizedTest(name = "{0}: トークン無しでは 401")
    @MethodSource("resources")
    void withoutTokenIsUnauthorized(
            String path, String body, String patchBody, String field, String updated) throws Exception {
        mockMvc.perform(get("/api/" + path)).andExpect(status().isUnauthorized());
    }

    @ParameterizedTest(name = "{0}: 他人のメンバーには紐付けられない")
    @MethodSource("resources")
    void cannotAttachToOtherUsersMember(
            String path, String body, String patchBody, String field, String updated) throws Exception {
        mockMvc.perform(
                        post("/api/" + path)
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body.replace("member-1", "member-2")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/" + path).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @DisplayName("存在しない資源は 404")
    @ParameterizedTest(name = "{0}")
    @MethodSource("resources")
    void missingIsNotFound(String path, String body, String patchBody, String field, String updated)
            throws Exception {
        mockMvc.perform(get("/api/" + path + "/nope").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isNotFound());
        assertThat(true).isTrue();
    }
}
