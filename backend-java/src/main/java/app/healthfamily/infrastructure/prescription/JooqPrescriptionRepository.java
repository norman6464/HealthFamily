package app.healthfamily.infrastructure.prescription;

import static app.healthfamily.infrastructure.jooq.Tables.PRESCRIPTION;
import static app.healthfamily.infrastructure.jooq.Tables.PRESCRIPTIONITEM;

import app.healthfamily.domain.prescription.Prescription;
import app.healthfamily.domain.prescription.PrescriptionItem;
import app.healthfamily.domain.prescription.PrescriptionRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

/**
 * 処方箋集約の永続化（jOOQ）。
 *
 * <p>明細は集約の一部なので、読み出しでは必ず一緒に取り、書き込みでは全消し全入れにする。
 * 差分更新にすると「どの明細が残っているか」を外から意識する必要が出て、
 * 集約の内側に隠したはずの構造が漏れる。
 */
@Repository
public class JooqPrescriptionRepository implements PrescriptionRepository {

    private final DSLContext dsl;

    public JooqPrescriptionRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Optional<Prescription> findById(String prescriptionId) {
        return dsl.select()
                .from(PRESCRIPTION)
                .where(PRESCRIPTION.ID.eq(prescriptionId))
                .fetchOptional()
                .map(row -> toAggregate(row, loadItems(prescriptionId)));
    }

    @Override
    public void saveItems(Prescription prescription) {
        dsl.deleteFrom(PRESCRIPTIONITEM)
                .where(PRESCRIPTIONITEM.PRESCRIPTIONID.eq(prescription.id()))
                .execute();

        var inserts =
                prescription.items().stream()
                        .map(
                                it ->
                                        dsl.insertInto(PRESCRIPTIONITEM)
                                                .set(PRESCRIPTIONITEM.ID, it.id())
                                                .set(PRESCRIPTIONITEM.PRESCRIPTIONID, prescription.id())
                                                .set(PRESCRIPTIONITEM.NAME, it.name())
                                                .set(PRESCRIPTIONITEM.DOSAGE, it.dosage())
                                                .set(PRESCRIPTIONITEM.FREQUENCY, it.frequency())
                                                .set(PRESCRIPTIONITEM.DAYS, it.days())
                                                .set(PRESCRIPTIONITEM.SORTORDER, it.sortOrder()))
                        .toList();
        if (!inserts.isEmpty()) {
            dsl.batch(inserts).execute();
        }
    }

    private List<PrescriptionItem> loadItems(String prescriptionId) {
        return dsl.select()
                .from(PRESCRIPTIONITEM)
                .where(PRESCRIPTIONITEM.PRESCRIPTIONID.eq(prescriptionId))
                .orderBy(PRESCRIPTIONITEM.SORTORDER.asc())
                .fetch()
                .map(
                        r ->
                                new PrescriptionItem(
                                        r.get(PRESCRIPTIONITEM.ID),
                                        r.get(PRESCRIPTIONITEM.NAME),
                                        r.get(PRESCRIPTIONITEM.DOSAGE),
                                        r.get(PRESCRIPTIONITEM.FREQUENCY),
                                        r.get(PRESCRIPTIONITEM.DAYS),
                                        r.get(PRESCRIPTIONITEM.SORTORDER)));
    }

    private static Prescription toAggregate(Record row, List<PrescriptionItem> items) {
        OffsetDateTime prescribedAt = row.get(PRESCRIPTION.PRESCRIBEDAT);
        OffsetDateTime expiresAt = row.get(PRESCRIPTION.EXPIRESAT);
        return Prescription.reconstitute(
                row.get(PRESCRIPTION.ID),
                row.get(PRESCRIPTION.USERID),
                row.get(PRESCRIPTION.MEMBERID),
                row.get(PRESCRIPTION.PRESCRIPTIONNAME),
                prescribedAt == null ? null : prescribedAt.toInstant(),
                expiresAt == null ? null : expiresAt.toInstant(),
                items);
    }
}
