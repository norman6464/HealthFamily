package app.healthfamily.medication.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import app.healthfamily.TestcontainersConfiguration;
import app.healthfamily.auth.domain.AccessTokenIssuer;
import app.healthfamily.auth.domain.User;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
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
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 薬エンドポイントを、実 DB と実トークンで通す。
 *
 * <p>認証はモックせず、{@link AccessTokenIssuer} が発行した本物のトークンを
 * Authorization ヘッダに載せる。認可設定まで含めて検証したいため。
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, MedicationControllerIT.FixedClockConfig.class})
@DisplayName("薬エンドポイント（実DB）")
class MedicationControllerIT {

    /** 2026-08-16 12:00 UTC = JST では 8/16 の 21:00。「今日」は 8/16 になる */
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
    @Autowired JdbcClient jdbc;
    @Autowired AccessTokenIssuer tokens;

    private String bearer;

    @BeforeEach
    void setUp() {
        jdbc.sql("TRUNCATE \"MedicationRecord\", \"Medication\", \"Member\", \"User\" CASCADE")
                .update();
        jdbc.sql(
                        """
                        INSERT INTO "User" (id, email, password, "displayName", "updatedAt")
                        VALUES ('user-1', 'owner@example.test', '', '所有者', now()),
                               ('user-2', 'other@example.test', '', '別人',   now())
                        """)
                .update();
        jdbc.sql(
                        """
                        INSERT INTO "Member" (id, "userId", name, "memberType", "updatedAt")
                        VALUES ('member-1', 'user-1', '本人', 'human', now())
                        """)
                .update();

        var user = User.reconstitute("user-1", "owner@example.test", "", "所有者", "cat", null, true);
        bearer = "Bearer " + tokens.issue(user, NOW);
    }

    private void insertMedication(
            String id,
            String category,
            String status,
            Integer stock,
            Integer intervalHours,
            LocalDate alertDate) {
        jdbc.sql(
                        """
                        INSERT INTO "Medication"
                               (id, "memberId", "userId", name, category, status,
                                "stockQuantity", "intervalHours", "stockAlertDate",
                                "dosageAmount", "updatedAt")
                        VALUES (:id, 'member-1', 'user-1', :name, :category, :status,
                                :stock, :interval, :alertDate, '1錠', now())
                        """)
                .param("id", id)
                .param("name", "薬-" + id)
                .param("category", category)
                .param("status", status)
                .param("stock", stock)
                .param("interval", intervalHours)
                .param(
                        "alertDate",
                        alertDate == null
                                ? null
                                : OffsetDateTime.of(alertDate.atStartOfDay(), ZoneOffset.UTC))
                .update();
    }

    private Integer stockOf(String id) {
        return jdbc.sql("SELECT \"stockQuantity\" FROM \"Medication\" WHERE id = :id")
                .param("id", id)
                .query(Integer.class)
                .optional()
                .orElse(null);
    }

    // --- 服用の記録 ---------------------------------------------------------

    @Test
    @DisplayName("服用を記録すると 201 が返り、残数が減る")
    void takeReturnsCreated() throws Exception {
        insertMedication("med-1", "prn", "active", 10, 4, null);

        mockMvc.perform(
                        post("/api/medications/med-1/take")
                                .header(HttpHeaders.AUTHORIZATION, bearer)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"notes\":\"頭痛のため\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.medicationId").value("med-1"))
                .andExpect(jsonPath("$.data.notes").value("頭痛のため"))
                .andExpect(jsonPath("$.data.dosageAmount").value("1錠"));

        assertThat(stockOf("med-1")).isEqualTo(9);
    }

    @Test
    @DisplayName("ボディ無しでも服用を記録できる")
    void takeWithoutBody() throws Exception {
        insertMedication("med-2", "regular", "active", 5, null, null);

        mockMvc.perform(
                        post("/api/medications/med-2/take")
                                .header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isCreated());

        assertThat(stockOf("med-2")).isEqualTo(4);
    }

    @Test
    @DisplayName("服用間隔が空いていなければ 409 を返し、何も書き込まれない")
    void intervalViolationReturnsConflict() throws Exception {
        insertMedication("med-3", "prn", "active", 10, 4, null);
        jdbc.sql(
                        """
                        INSERT INTO "MedicationRecord"
                               (id, "medicationId", "memberId", "userId", "takenAt")
                        VALUES ('rec-1', 'med-3', 'member-1', 'user-1', :at)
                        """)
                .param("at", OffsetDateTime.ofInstant(NOW.minus(Duration.ofHours(1)), ZoneOffset.UTC))
                .update();

        mockMvc.perform(
                        post("/api/medications/med-3/take")
                                .header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value(
                        org.hamcrest.Matchers.containsString("4 時間")));

        assertThat(stockOf("med-3")).isEqualTo(10);
    }

    @Test
    @DisplayName("休薬中の薬は 409")
    void pausedReturnsConflict() throws Exception {
        insertMedication("med-4", "prn", "paused", 10, null, null);

        mockMvc.perform(
                        post("/api/medications/med-4/take")
                                .header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("存在しない薬は 404")
    void unknownReturnsNotFound() throws Exception {
        mockMvc.perform(
                        post("/api/medications/missing/take")
                                .header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("トークン無しでは 401")
    void withoutTokenIsUnauthorized() throws Exception {
        insertMedication("med-5", "prn", "active", 10, null, null);

        mockMvc.perform(post("/api/medications/med-5/take")).andExpect(status().isUnauthorized());

        assertThat(stockOf("med-5")).isEqualTo(10);
    }

    @Test
    @DisplayName("他人のトークンでは 403 で、残数も変わらない")
    void otherUsersTokenIsForbidden() throws Exception {
        insertMedication("med-6", "prn", "active", 10, null, null);
        var other = User.reconstitute("user-2", "other@example.test", "", null, "cat", null, true);

        mockMvc.perform(
                        post("/api/medications/med-6/take")
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokens.issue(other, NOW)))
                .andExpect(status().isForbidden());

        assertThat(stockOf("med-6")).isEqualTo(10);
    }

    // --- 一覧と残数アラート --------------------------------------------------

    @Test
    @DisplayName("一覧は自分の薬だけを返す")
    void listReturnsOwnMedications() throws Exception {
        insertMedication("med-7", "prn", "active", 10, null, null);
        insertMedication("med-8", "regular", "active", 3, null, null);

        mockMvc.perform(get("/api/medications").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("残数アラートはサーバー側で判定される")
    void alertsAreComputedOnServer() throws Exception {
        // アラート日まで 10 日 / 残数 3 → 少ない
        insertMedication("low", "regular", "active", 3, null, LocalDate.of(2026, 8, 26));
        // アラート日まで 10 日 / 残数 30 → 足りている
        insertMedication("enough", "regular", "active", 30, null, LocalDate.of(2026, 8, 26));
        // アラート日が過ぎている → 対象外
        insertMedication("past", "regular", "active", 1, null, LocalDate.of(2026, 8, 1));
        // 残数を管理していない → 対象外
        insertMedication("untracked", "regular", "active", null, null, LocalDate.of(2026, 8, 26));

        mockMvc.perform(get("/api/medications/alerts").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value("low"))
                .andExpect(jsonPath("$.data[0].lowStock").value(true));
    }

    @Test
    @DisplayName("一覧にも lowStock が付く")
    void listIncludesLowStockFlag() throws Exception {
        insertMedication("med-9", "regular", "active", 3, null, LocalDate.of(2026, 8, 26));

        mockMvc.perform(get("/api/medications").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].lowStock").value(true));
    }
}
