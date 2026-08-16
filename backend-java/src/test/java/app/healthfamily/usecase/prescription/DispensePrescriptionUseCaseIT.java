package app.healthfamily.usecase.prescription;

import static app.healthfamily.infrastructure.jooq.Tables.MEDICATION;
import static app.healthfamily.infrastructure.jooq.Tables.PRESCRIPTION;
import static app.healthfamily.infrastructure.jooq.Tables.PRESCRIPTIONITEM;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.prescription.Prescription;
import app.healthfamily.domain.shared.DomainException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * 調剤を実 DB に対して検証する。
 *
 * <p>いちばん確かめたいのは、<b>途中で失敗したときに薬が 1 件も残らない</b>こと。
 * 明細を 1 件ずつ登録していく実装では、3 件目で落ちると 1・2 件目だけが残る。
 */
@SpringBootTest
@DisplayName("調剤（実DB）")
class DispensePrescriptionUseCaseIT {

    @Autowired DispensePrescriptionUseCase useCase;
    @Autowired DSLContext dsl;

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
    }

    private void insertPrescription(String id) {
        dsl.execute(
                """
                INSERT INTO "Prescription"
                       (id, "userId", "memberId", "prescriptionName", "prescribedAt")
                VALUES (?, 'user-1', 'member-1', '8月分', CAST(? AS timestamptz))
                """,
                id,
                OffsetDateTime.of(2026, 8, 1, 0, 0, 0, 0, ZoneOffset.UTC));
    }

    private void insertItem(String prescriptionId, String itemId, String name, int sortOrder) {
        dsl.execute(
                """
                INSERT INTO "PrescriptionItem"
                       (id, "prescriptionId", name, dosage, frequency, days, "sortOrder")
                VALUES (?, ?, ?, '1錠', '1日3回', 14, ?)
                """,
                itemId,
                prescriptionId,
                name,
                sortOrder);
    }

    private long medicationCount() {
        return dsl.fetchCount(MEDICATION);
    }

    @Test
    @DisplayName("明細の数だけ薬が作られる")
    void createsOneMedicationPerItem() {
        insertPrescription("rx-1");
        insertItem("rx-1", "it-1", "ロキソニン", 0);
        insertItem("rx-1", "it-2", "ムコスタ", 1);

        var created = useCase.execute(new DispensePrescriptionUseCase.Command("user-1", "rx-1"));

        assertThat(created).hasSize(2);
        assertThat(medicationCount()).isEqualTo(2);
        assertThat(
                        dsl.select(MEDICATION.NAME)
                                .from(MEDICATION)
                                .orderBy(MEDICATION.NAME)
                                .fetch(MEDICATION.NAME))
                .containsExactly("ムコスタ", "ロキソニン");
    }

    @Test
    @DisplayName("作られた薬は処方箋のメンバーと所有者を引き継ぐ")
    void inheritsOwnerAndMember() {
        insertPrescription("rx-2");
        insertItem("rx-2", "it-3", "ロキソニン", 0);

        useCase.execute(new DispensePrescriptionUseCase.Command("user-1", "rx-2"));

        var row = dsl.select().from(MEDICATION).fetchSingle();
        assertThat(row.get(MEDICATION.USERID)).isEqualTo("user-1");
        assertThat(row.get(MEDICATION.MEMBERID)).isEqualTo("member-1");
        assertThat(row.get(MEDICATION.CATEGORY)).isEqualTo("regular");
        assertThat(row.get(MEDICATION.DOSAGEAMOUNT)).isEqualTo("1錠");
        assertThat(row.get(MEDICATION.FREQUENCY)).isEqualTo("1日3回");
    }

    @Test
    @DisplayName("明細が無ければ薬は1件も作られない")
    void withoutItemsNothingIsCreated() {
        insertPrescription("rx-3");

        assertThatThrownBy(
                        () -> useCase.execute(new DispensePrescriptionUseCase.Command("user-1", "rx-3")))
                .isInstanceOf(DomainException.Validation.class)
                .hasMessageContaining("処方明細がありません");

        assertThat(medicationCount()).isZero();
    }

    @Test
    @DisplayName("他人の処方箋は調剤できず、薬も作られない")
    void otherUsersPrescriptionIsForbidden() {
        insertPrescription("rx-4");
        insertItem("rx-4", "it-4", "ロキソニン", 0);

        assertThatThrownBy(
                        () -> useCase.execute(new DispensePrescriptionUseCase.Command("user-2", "rx-4")))
                .isInstanceOf(DomainException.Forbidden.class);

        assertThat(medicationCount()).isZero();
    }

    @Test
    @DisplayName("存在しない処方箋は 404 相当")
    void unknownPrescriptionIsNotFound() {
        assertThatThrownBy(
                        () ->
                                useCase.execute(
                                        new DispensePrescriptionUseCase.Command("user-1", "missing")))
                .isInstanceOf(DomainException.NotFound.class);
    }

    @Test
    @DisplayName("途中で失敗したら薬は1件も残らない")
    void partialFailureLeavesNothingBehind() {
        // 2件目の登録だけを確実に失敗させるため、薬名に一時的な一意制約を張る。
        // 1件ずつ別トランザクションで登録する実装なら、1件目が残ってこのテストが落ちる。
        dsl.execute("CREATE UNIQUE INDEX tmp_medication_name ON \"Medication\" (name)");
        try {
            insertPrescription("rx-5");
            insertItem("rx-5", "it-5", "ロキソニン", 0);
            insertItem("rx-5", "it-6", "ロキソニン", 1);
            insertItem("rx-5", "it-7", "カロナール", 2);

            assertThatThrownBy(
                            () ->
                                    useCase.execute(
                                            new DispensePrescriptionUseCase.Command("user-1", "rx-5")))
                    .isInstanceOf(Exception.class);

            assertThat(medicationCount())
                    .as("1件目だけが残っていてはいけない")
                    .isZero();
        } finally {
            dsl.execute("DROP INDEX IF EXISTS tmp_medication_name");
        }
    }

    @Test
    @DisplayName("明細を入れ替えると、以前の明細は消えて並び順が振り直される")
    void replaceItemsPersistsOrder() {
        insertPrescription("rx-6");
        insertItem("rx-6", "it-8", "古い薬", 0);

        useCase.replaceItems(
                new DispensePrescriptionUseCase.ReplaceItemsCommand(
                        "user-1",
                        "rx-6",
                        List.of(
                                new Prescription.ItemDraft("カロナール", "2錠", "1日2回", 7),
                                new Prescription.ItemDraft("ロキソニン", null, null, null))));

        var rows =
                dsl.select(PRESCRIPTIONITEM.NAME, PRESCRIPTIONITEM.SORTORDER)
                        .from(PRESCRIPTIONITEM)
                        .where(PRESCRIPTIONITEM.PRESCRIPTIONID.eq("rx-6"))
                        .orderBy(PRESCRIPTIONITEM.SORTORDER)
                        .fetch();

        assertThat(rows.map(r -> r.get(PRESCRIPTIONITEM.NAME)))
                .containsExactly("カロナール", "ロキソニン");
        assertThat(rows.map(r -> r.get(PRESCRIPTIONITEM.SORTORDER))).containsExactly(0, 1);
    }

    @Test
    @DisplayName("処方箋そのものは調剤で消えない")
    void prescriptionSurvivesDispense() {
        insertPrescription("rx-7");
        insertItem("rx-7", "it-9", "ロキソニン", 0);

        useCase.execute(new DispensePrescriptionUseCase.Command("user-1", "rx-7"));

        assertThat(dsl.fetchCount(PRESCRIPTION, PRESCRIPTION.ID.eq("rx-7"))).isEqualTo(1);
    }
}
