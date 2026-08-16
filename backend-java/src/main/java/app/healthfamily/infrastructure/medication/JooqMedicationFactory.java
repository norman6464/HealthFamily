package app.healthfamily.infrastructure.medication;

import static app.healthfamily.infrastructure.jooq.Tables.MEDICATION;

import app.healthfamily.domain.medication.MedicationCategory;
import app.healthfamily.domain.medication.MedicationFactory;
import app.healthfamily.domain.medication.MedicationStatus;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

/**
 * 薬をまとめて登録する（jOOQ）。
 *
 * <p>1 回の batch で流すので、呼び出し側のトランザクションの中で全件成功か全件失敗になる。
 */
@Repository
public class JooqMedicationFactory implements MedicationFactory {

    private final DSLContext dsl;

    public JooqMedicationFactory(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public List<String> createAll(List<NewMedication> orders) {
        if (orders.isEmpty()) {
            return List.of();
        }
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        var ids = orders.stream().map(o -> UUID.randomUUID().toString()).toList();

        var inserts =
                java.util.stream.IntStream.range(0, orders.size())
                        .mapToObj(
                                i -> {
                                    NewMedication o = orders.get(i);
                                    return dsl.insertInto(MEDICATION)
                                            .set(MEDICATION.ID, ids.get(i))
                                            .set(MEDICATION.MEMBERID, o.memberId())
                                            .set(MEDICATION.USERID, o.userId())
                                            .set(MEDICATION.NAME, o.name())
                                            .set(MEDICATION.CATEGORY, MedicationCategory.REGULAR.code())
                                            .set(MEDICATION.STATUS, MedicationStatus.ACTIVE.code())
                                            .set(MEDICATION.DOSAGEAMOUNT, o.dosage())
                                            .set(MEDICATION.FREQUENCY, o.frequency())
                                            .set(MEDICATION.DISPLAYORDER, i)
                                            .set(MEDICATION.ISACTIVE, true)
                                            .set(MEDICATION.UPDATEDAT, now);
                                })
                        .toList();

        dsl.batch(inserts).execute();
        return ids;
    }
}
