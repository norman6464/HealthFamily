package app.healthfamily.infrastructure.healthrecord;

import static app.healthfamily.infrastructure.jooq.Tables.BODYMEASUREMENT;

import app.healthfamily.domain.healthrecord.BodyMeasurement;
import app.healthfamily.domain.healthrecord.BodyMeasurementRecord;
import app.healthfamily.usecase.crud.OwnedCrudRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

/** 体格記録の永続化（jOOQ）。 */
@Repository
public class JooqBodyMeasurementRepository implements OwnedCrudRepository<BodyMeasurementRecord> {

    private final DSLContext dsl;

    public JooqBodyMeasurementRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Optional<BodyMeasurementRecord> findById(String id) {
        return dsl.select().from(BODYMEASUREMENT).where(BODYMEASUREMENT.ID.eq(id))
                .fetchOptional().map(JooqBodyMeasurementRepository::toDomain);
    }

    @Override
    public List<BodyMeasurementRecord> listByUser(String userId) {
        return dsl.select().from(BODYMEASUREMENT)
                .where(BODYMEASUREMENT.USERID.eq(userId))
                .orderBy(BODYMEASUREMENT.RECORDEDAT.desc())
                .fetch().map(JooqBodyMeasurementRepository::toDomain);
    }

    @Override
    public void save(BodyMeasurementRecord r) {
        var recorded = OffsetDateTime.ofInstant(r.recordedAt(), ZoneOffset.UTC);
        var weight = r.measurement().weightKg();
        var height = r.measurement().heightCm();
        dsl.insertInto(BODYMEASUREMENT)
                .set(BODYMEASUREMENT.ID, r.id())
                .set(BODYMEASUREMENT.USERID, r.userId())
                .set(BODYMEASUREMENT.MEMBERID, r.memberId())
                .set(BODYMEASUREMENT.WEIGHT, weight)
                .set(BODYMEASUREMENT.HEIGHT, height)
                .set(BODYMEASUREMENT.RECORDEDAT, recorded)
                .set(BODYMEASUREMENT.NOTES, r.notes())
                .onConflict(BODYMEASUREMENT.ID)
                .doUpdate()
                .set(BODYMEASUREMENT.WEIGHT, weight)
                .set(BODYMEASUREMENT.HEIGHT, height)
                .set(BODYMEASUREMENT.RECORDEDAT, recorded)
                .set(BODYMEASUREMENT.NOTES, r.notes())
                .execute();
    }

    @Override
    public void deleteById(String id) {
        dsl.deleteFrom(BODYMEASUREMENT).where(BODYMEASUREMENT.ID.eq(id)).execute();
    }

    private static BodyMeasurementRecord toDomain(Record r) {
        return new BodyMeasurementRecord(
                r.get(BODYMEASUREMENT.ID),
                r.get(BODYMEASUREMENT.USERID),
                r.get(BODYMEASUREMENT.MEMBERID),
                BodyMeasurement.of(r.get(BODYMEASUREMENT.WEIGHT), r.get(BODYMEASUREMENT.HEIGHT)),
                r.get(BODYMEASUREMENT.RECORDEDAT).toInstant(),
                r.get(BODYMEASUREMENT.NOTES));
    }
}
