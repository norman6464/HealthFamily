package app.healthfamily.apiController.prescription;

import static app.healthfamily.infrastructure.jooq.Tables.MEDICATION;
import static app.healthfamily.infrastructure.jooq.Tables.PRESCRIPTIONITEM;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import app.healthfamily.domain.auth.AccessTokenIssuer;
import app.healthfamily.domain.auth.User;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
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

/** 処方箋エンドポイントを、実 DB と実トークンで通す。 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("処方箋エンドポイント（実DB）")
class PrescriptionControllerIT {

    private static final Instant NOW = Instant.parse("2026-08-16T12:00:00Z");

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
        dsl.execute(
                """
                INSERT INTO "Member" (id, "userId", name, "memberType", "updatedAt")
                VALUES ('member-1', 'user-1', '本人', 'human', now())
                """);
        dsl.execute(
                """
                INSERT INTO "Prescription" (id, "userId", "memberId", "prescriptionName", "prescribedAt")
                VALUES ('rx-1', 'user-1', 'member-1', '8月分', CAST(? AS timestamptz))
                """,
                OffsetDateTime.of(2026, 8, 1, 0, 0, 0, 0, ZoneOffset.UTC));

        bearer =
                "Bearer "
                        + tokens.issue(
                                User.reconstitute(
                                        "user-1", "owner@example.test", "", null, "cat", null, true),
                                NOW);
        otherBearer =
                "Bearer "
                        + tokens.issue(
                                User.reconstitute(
                                        "user-2", "other@example.test", "", null, "cat", null, true),
                                NOW);
    }

    private static final String ITEMS_BODY =
            """
            {"items":[
              {"name":"ロキソニン","dosage":"1錠","frequency":"1日3回","days":14},
              {"name":"ムコスタ","dosage":"1錠","frequency":"1日3回","days":14}
            ]}
            """;

    @Test
    @DisplayName("明細を登録できる")
    void replaceItems() throws Exception {
        mockMvc.perform(
                        put("/api/prescriptions/rx-1/items")
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(ITEMS_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(dsl.fetchCount(PRESCRIPTIONITEM)).isEqualTo(2);
    }

    @Test
    @DisplayName("空の明細は 400")
    void emptyItemsAreRejected() throws Exception {
        mockMvc.perform(
                        put("/api/prescriptions/rx-1/items")
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"items\":[]}"))
                .andExpect(status().isBadRequest());

        assertThat(dsl.fetchCount(PRESCRIPTIONITEM)).isZero();
    }

    @Test
    @DisplayName("調剤すると明細の数だけ薬が作られる")
    void dispenseCreatesMedications() throws Exception {
        mockMvc.perform(
                put("/api/prescriptions/rx-1/items")
                        .header(HttpHeaders.AUTHORIZATION, bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ITEMS_BODY));

        mockMvc.perform(
                        post("/api/prescriptions/rx-1/dispense")
                                .header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.createdCount").value(2))
                .andExpect(jsonPath("$.data.medicationIds.length()").value(2));

        assertThat(dsl.fetchCount(MEDICATION)).isEqualTo(2);
    }

    @Test
    @DisplayName("明細が無い処方箋の調剤は 400")
    void dispenseWithoutItemsIsBadRequest() throws Exception {
        mockMvc.perform(
                        post("/api/prescriptions/rx-1/dispense")
                                .header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isBadRequest());

        assertThat(dsl.fetchCount(MEDICATION)).isZero();
    }

    @Test
    @DisplayName("他人の処方箋は 403 で、薬も作られない")
    void otherUsersPrescriptionIsForbidden() throws Exception {
        mockMvc.perform(
                put("/api/prescriptions/rx-1/items")
                        .header(HttpHeaders.AUTHORIZATION, bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ITEMS_BODY));

        mockMvc.perform(
                        post("/api/prescriptions/rx-1/dispense")
                                .header(HttpHeaders.AUTHORIZATION, otherBearer))
                .andExpect(status().isForbidden());

        assertThat(dsl.fetchCount(MEDICATION)).isZero();
    }

    @Test
    @DisplayName("トークン無しでは 401")
    void withoutTokenIsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/prescriptions/rx-1/dispense")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("存在しない処方箋は 404")
    void unknownPrescriptionIsNotFound() throws Exception {
        mockMvc.perform(
                        post("/api/prescriptions/missing/dispense")
                                .header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isNotFound());
    }
}
