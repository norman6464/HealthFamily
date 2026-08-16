package app.healthfamily.infrastructure.medication;

import static app.healthfamily.infrastructure.jooq.Tables.MEDICATIONRECORD;

import app.healthfamily.domain.medication.MedicationRecord;
import app.healthfamily.domain.medication.MedicationRecordRepository;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

/** 服薬記録の永続化（jOOQ）。 */
@Repository
public class JooqMedicationRecordRepository implements MedicationRecordRepository {

    private final DSLContext dsl;

    public JooqMedicationRecordRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Optional<Instant> findLastTakenAt(String medicationId) {
        return dsl.select(MEDICATIONRECORD.TAKENAT)
                .from(MEDICATIONRECORD)
                .where(MEDICATIONRECORD.MEDICATIONID.eq(medicationId))
                .orderBy(MEDICATIONRECORD.TAKENAT.desc())
                .limit(1)
                .fetchOptional(MEDICATIONRECORD.TAKENAT)
                .map(OffsetDateTime::toInstant);
    }

    @Override
    public void append(MedicationRecord record) {
        dsl.insertInto(MEDICATIONRECORD)
                .set(MEDICATIONRECORD.ID, record.id())
                .set(MEDICATIONRECORD.MEDICATIONID, record.medicationId())
                .set(MEDICATIONRECORD.MEMBERID, record.memberId())
                .set(MEDICATIONRECORD.USERID, record.userId())
                .set(MEDICATIONRECORD.SCHEDULEID, record.scheduleId())
                .set(MEDICATIONRECORD.TAKENAT, OffsetDateTime.ofInstant(record.takenAt(), ZoneOffset.UTC))
                .set(MEDICATIONRECORD.DOSAGEAMOUNT, record.dosageAmount())
                .set(MEDICATIONRECORD.NOTES, record.notes())
                .execute();
    }
}
