package app.healthfamily.infrastructure.medication;

import static org.assertj.core.api.Assertions.assertThat;

import app.healthfamily.domain.medication.Medication;
import app.healthfamily.domain.medication.MedicationCategory;
import app.healthfamily.domain.medication.MedicationRepository;
import app.healthfamily.domain.medication.MedicationStatus;
import app.healthfamily.domain.medication.StockQuantity;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * jOOQ によるリポジトリ実装を、compose の PostgreSQL に対して検証する。
 *
 * <p>ここで確かめたいのは「行 ↔ 集約」の変換が往復しても壊れないこと。
 * SQL とマッピングは本物の DB でしか検証できないので、モックは使わない。
 */
@SpringBootTest
@DisplayName("薬リポジトリ（jOOQ / 実DB）")
class JooqMedicationRepositoryIT {

    @Autowired MedicationRepository repository;
    @Autowired DSLContext dsl;

    @BeforeEach
    void setUp() {
        dsl.execute("TRUNCATE \"MedicationRecord\", \"Medication\", \"Member\", \"User\" CASCADE");
        dsl.execute(
                """
                INSERT INTO "User" (id, email, password, "displayName", "updatedAt")
                VALUES ('user-1', 'owner@example.test', '', '所有者', now())
                """);
        dsl.execute(
                """
                INSERT INTO "Member" (id, "userId", name, "memberType", "updatedAt")
                VALUES ('member-1', 'user-1', '本人', 'human', now())
                """);
    }

    private void insert(
            String id, String category, String status, Integer stock, Integer interval, LocalDate alert) {
        dsl.execute(
                """
                INSERT INTO "Medication"
                       (id, "memberId", "userId", name, category, status,
                        "stockQuantity", "intervalHours", "stockAlertDate",
                        "dosageAmount", "displayOrder", "updatedAt")
                VALUES (?, 'member-1', 'user-1', 'ロキソニン', ?, ?, ?, ?, CAST(? AS timestamptz), '1錠', 0, now())
                """,
                id,
                category,
                status,
                stock,
                interval,
                alert == null ? null : OffsetDateTime.of(alert.atStartOfDay(), ZoneOffset.UTC));
    }

    @Test
    @DisplayName("保存された行を集約として読み戻せる")
    void findByIdMapsAllFields() {
        insert("med-1", "prn", "active", 7, 4, LocalDate.of(2026, 9, 1));

        var found = repository.findById("med-1").orElseThrow();

        assertThat(found.id()).isEqualTo("med-1");
        assertThat(found.userId()).isEqualTo("user-1");
        assertThat(found.memberId()).isEqualTo("member-1");
        assertThat(found.name()).isEqualTo("ロキソニン");
        assertThat(found.category()).isEqualTo(MedicationCategory.PRN);
        assertThat(found.status()).isEqualTo(MedicationStatus.ACTIVE);
        assertThat(found.stock()).contains(StockQuantity.of(7));
        assertThat(found.interval().orElseThrow().hours()).isEqualTo(4);
        assertThat(found.stockAlertDate()).contains(LocalDate.of(2026, 9, 1));
        assertThat(found.dosageAmount()).contains("1錠");
    }

    @Test
    @DisplayName("NULL 可能な列は空として読める")
    void nullableColumnsBecomeEmpty() {
        insert("med-2", "regular", "active", null, null, null);

        var found = repository.findById("med-2").orElseThrow();

        assertThat(found.stock()).isEmpty();
        assertThat(found.interval()).isEmpty();
        assertThat(found.stockAlertDate()).isEmpty();
    }

    @Test
    @DisplayName("存在しないIDは空を返す")
    void unknownIdReturnsEmpty() {
        assertThat(repository.findById("missing")).isEmpty();
    }

    @Test
    @DisplayName("集約の残数変更を書き戻せる")
    void saveWritesBackStock() {
        insert("med-3", "prn", "active", 5, null, null);
        Medication medication = repository.findById("med-3").orElseThrow();

        medication.take(java.time.Instant.parse("2026-08-16T00:00:00Z"), java.util.Optional.empty());
        repository.save(medication);

        assertThat(repository.findById("med-3").orElseThrow().stock()).contains(StockQuantity.of(4));
    }

    @Test
    @DisplayName("一覧は所有ユーザーのものだけを displayOrder 順で返す")
    void listByUserIsScopedAndOrdered() {
        insert("med-b", "regular", "active", 1, null, null);
        insert("med-a", "regular", "active", 1, null, null);
        dsl.execute("UPDATE \"Medication\" SET \"displayOrder\" = 1 WHERE id = 'med-b'");
        dsl.execute("UPDATE \"Medication\" SET \"displayOrder\" = 0 WHERE id = 'med-a'");
        dsl.execute(
                """
                INSERT INTO "User" (id, email, password, "updatedAt")
                VALUES ('user-2', 'other@example.test', '', now())
                """);
        dsl.execute(
                """
                INSERT INTO "Member" (id, "userId", name, "memberType", "updatedAt")
                VALUES ('member-2', 'user-2', '他人', 'human', now())
                """);
        dsl.execute(
                """
                INSERT INTO "Medication" (id, "memberId", "userId", name, category, status, "updatedAt")
                VALUES ('med-other', 'member-2', 'user-2', '他人の薬', 'regular', 'active', now())
                """);

        var list = repository.listByUser("user-1");

        assertThat(list).extracting(Medication::id).containsExactly("med-a", "med-b");
    }
}
