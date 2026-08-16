package app.healthfamily.usecase.medication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.shared.DomainException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.simple.JdbcClient;

/**
 * 実際の PostgreSQL に対して「服用の記録」を通す統合テスト。
 *
 * <p>いちばん確かめたいのは、残数の減算と記録の追加が
 * <b>1 つのトランザクションにまとまっているか</b>。
 * 集約が服用を拒否したとき、残数だけ減って記録が無い、あるいはその逆が
 * 起きないことを検証する。
 */
@SpringBootTest
@Import({app.healthfamily.TestcontainersConfiguration.class, TakeMedicationUseCaseIT.FixedClockConfig.class})
@DisplayName("服用の記録（実DB）")
class TakeMedicationUseCaseIT {

    private static final Instant NOW = Instant.parse("2026-08-15T12:00:00Z");

    /**
     * ユースケースが参照する時刻を固定する。
     *
     * <p>本番の ClockConfig と Bean 名が衝突しないよう別名にし、
     * {@code @Primary} で注入側の優先度を上げている。
     */
    @TestConfiguration
    static class FixedClockConfig {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(NOW, ZoneOffset.UTC);
        }
    }

    @Autowired TakeMedicationUseCase useCase;
    @Autowired JdbcClient jdbc;

    @BeforeEach
    void resetFixtures() {
        jdbc.sql("TRUNCATE \"MedicationRecord\", \"Medication\", \"Member\", \"User\" CASCADE")
                .update();
        jdbc.sql(
                        """
                        INSERT INTO "User" (id, email, password, "displayName", "updatedAt")
                        VALUES ('user-1', 'owner@example.test', 'x', '所有者', now()),
                               ('user-2', 'other@example.test', 'x', '別人',   now())
                        """)
                .update();
        jdbc.sql(
                        """
                        INSERT INTO "Member" (id, "userId", name, "memberType", "updatedAt")
                        VALUES ('member-1', 'user-1', '本人', 'human', now())
                        """)
                .update();
    }

    private void insertMedication(
            String id, String category, String status, Integer stock, Integer intervalHours) {
        jdbc.sql(
                        """
                        INSERT INTO "Medication"
                               (id, "memberId", "userId", name, category, status,
                                "stockQuantity", "intervalHours", "dosageAmount", "updatedAt")
                        VALUES (:id, 'member-1', 'user-1', 'ロキソニン', :category, :status,
                                :stock, :interval, '1錠', now())
                        """)
                .param("id", id)
                .param("category", category)
                .param("status", status)
                .param("stock", stock)
                .param("interval", intervalHours)
                .update();
    }

    private void insertRecord(String medicationId, Instant takenAt) {
        jdbc.sql(
                        """
                        INSERT INTO "MedicationRecord"
                               (id, "medicationId", "memberId", "userId", "takenAt")
                        VALUES (gen_random_uuid()::text, :med, 'member-1', 'user-1', :at)
                        """)
                .param("med", medicationId)
                .param("at", OffsetDateTime.ofInstant(takenAt, ZoneOffset.UTC))
                .update();
    }

    private Integer stockOf(String id) {
        return jdbc.sql("SELECT \"stockQuantity\" FROM \"Medication\" WHERE id = :id")
                .param("id", id)
                .query(Integer.class)
                .optional()
                .orElse(null);
    }

    private long recordCount(String medicationId) {
        return jdbc.sql("SELECT count(*) FROM \"MedicationRecord\" WHERE \"medicationId\" = :id")
                .param("id", medicationId)
                .query(Long.class)
                .single();
    }

    @Test
    @DisplayName("服用すると残数が減り、記録が1件増える")
    void takingDecrementsStockAndAppendsRecord() {
        insertMedication("med-1", "prn", "active", 10, 4);

        var record = useCase.execute(new TakeMedicationUseCase.Command("user-1", "med-1", "頭痛"));

        assertThat(stockOf("med-1")).isEqualTo(9);
        assertThat(recordCount("med-1")).isEqualTo(1);
        assertThat(record.takenAt()).isEqualTo(NOW);
        assertThat(record.dosageAmount()).isEqualTo("1錠");
        assertThat(record.notes()).isEqualTo("頭痛");
    }

    @Test
    @DisplayName("服用間隔が空いていなければ、残数も記録も変わらない")
    void intervalViolationLeavesNothingBehind() {
        insertMedication("med-2", "prn", "active", 10, 4);
        insertRecord("med-2", NOW.minus(Duration.ofHours(3)));

        assertThatThrownBy(
                        () ->
                                useCase.execute(
                                        new TakeMedicationUseCase.Command("user-1", "med-2", null)))
                .isInstanceOf(DomainException.Conflict.class)
                .hasMessageContaining("4 時間");

        assertThat(stockOf("med-2")).isEqualTo(10);
        assertThat(recordCount("med-2")).isEqualTo(1); // 事前に入れた1件のみ
    }

    @Test
    @DisplayName("残数が0なら、記録は作られない")
    void emptyStockLeavesNothingBehind() {
        insertMedication("med-3", "prn", "active", 0, null);

        assertThatThrownBy(
                        () ->
                                useCase.execute(
                                        new TakeMedicationUseCase.Command("user-1", "med-3", null)))
                .isInstanceOf(DomainException.Conflict.class);

        assertThat(stockOf("med-3")).isZero();
        assertThat(recordCount("med-3")).isZero();
    }

    @Test
    @DisplayName("休薬中の薬は記録できない")
    void pausedMedicationIsRejected() {
        insertMedication("med-4", "prn", "paused", 10, null);

        assertThatThrownBy(
                        () ->
                                useCase.execute(
                                        new TakeMedicationUseCase.Command("user-1", "med-4", null)))
                .isInstanceOf(DomainException.Conflict.class)
                .hasMessageContaining("休薬中");

        assertThat(stockOf("med-4")).isEqualTo(10);
        assertThat(recordCount("med-4")).isZero();
    }

    @Test
    @DisplayName("他人の薬は操作できない")
    void otherUsersMedicationIsForbidden() {
        insertMedication("med-5", "prn", "active", 10, null);

        assertThatThrownBy(
                        () ->
                                useCase.execute(
                                        new TakeMedicationUseCase.Command("user-2", "med-5", null)))
                .isInstanceOf(DomainException.Forbidden.class);

        assertThat(recordCount("med-5")).isZero();
    }

    @Test
    @DisplayName("存在しない薬は見つからない")
    void unknownMedicationIsNotFound() {
        assertThatThrownBy(
                        () ->
                                useCase.execute(
                                        new TakeMedicationUseCase.Command("user-1", "missing", null)))
                .isInstanceOf(DomainException.NotFound.class);
    }

    @Test
    @DisplayName("残数を管理していない薬も服用できる")
    void medicationWithoutStockCanBeTaken() {
        insertMedication("med-6", "regular", "active", null, null);

        useCase.execute(new TakeMedicationUseCase.Command("user-1", "med-6", null));

        assertThat(stockOf("med-6")).isNull();
        assertThat(recordCount("med-6")).isEqualTo(1);
    }

    @Test
    @DisplayName("間隔ぶん経過していれば服用できる")
    void takingAfterIntervalSucceeds() {
        insertMedication("med-7", "prn", "active", 5, 4);
        insertRecord("med-7", NOW.minus(Duration.ofHours(4)));

        useCase.execute(new TakeMedicationUseCase.Command("user-1", "med-7", null));

        assertThat(stockOf("med-7")).isEqualTo(4);
        assertThat(recordCount("med-7")).isEqualTo(2);
    }
}
