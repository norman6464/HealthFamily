package app.healthfamily.infrastructure.healthrecord;

import static app.healthfamily.infrastructure.jooq.Tables.TEMPERATURERECORD;

import app.healthfamily.domain.healthrecord.BodyTemperature;
import app.healthfamily.domain.healthrecord.TemperatureRecord;
import app.healthfamily.usecase.crud.OwnedCrudRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

/** 体温記録の永続化（jOOQ）。 */
@Repository
public class JooqTemperatureRecordRepository implements OwnedCrudRepository<TemperatureRecord> {

    private final DSLContext dsl;

    public JooqTemperatureRecordRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Optional<TemperatureRecord> findById(String id) {
        return dsl.select().from(TEMPERATURERECORD).where(TEMPERATURERECORD.ID.eq(id))
                .fetchOptional().map(JooqTemperatureRecordRepository::toDomain);
    }

    @Override
    public List<TemperatureRecord> listByUser(String userId) {
        return dsl.select().from(TEMPERATURERECORD)
                .where(TEMPERATURERECORD.USERID.eq(userId))
                .orderBy(TEMPERATURERECORD.MEASUREDAT.desc())
                .fetch().map(JooqTemperatureRecordRepository::toDomain);
    }

    @Override
    public void save(TemperatureRecord r) {
        var measured = OffsetDateTime.ofInstant(r.measuredAt(), ZoneOffset.UTC);
        dsl.insertInto(TEMPERATURERECORD)
                .set(TEMPERATURERECORD.ID, r.id())
                .set(TEMPERATURERECORD.USERID, r.userId())
                .set(TEMPERATURERECORD.MEMBERID, r.memberId())
                .set(TEMPERATURERECORD.TEMPERATURE, r.temperature().value())
                .set(TEMPERATURERECORD.MEASUREDAT, measured)
                .set(TEMPERATURERECORD.NOTES, r.notes())
                .onConflict(TEMPERATURERECORD.ID)
                .doUpdate()
                .set(TEMPERATURERECORD.TEMPERATURE, r.temperature().value())
                .set(TEMPERATURERECORD.MEASUREDAT, measured)
                .set(TEMPERATURERECORD.NOTES, r.notes())
                .execute();
    }

    @Override
    public void deleteById(String id) {
        dsl.deleteFrom(TEMPERATURERECORD).where(TEMPERATURERECORD.ID.eq(id)).execute();
    }

    private static TemperatureRecord toDomain(Record r) {
        return new TemperatureRecord(
                r.get(TEMPERATURERECORD.ID),
                r.get(TEMPERATURERECORD.USERID),
                r.get(TEMPERATURERECORD.MEMBERID),
                BodyTemperature.of(r.get(TEMPERATURERECORD.TEMPERATURE)),
                r.get(TEMPERATURERECORD.MEASUREDAT).toInstant(),
                r.get(TEMPERATURERECORD.NOTES));
    }
}
