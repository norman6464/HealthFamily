package app.healthfamily.infrastructure.healthrecord;

import static app.healthfamily.infrastructure.jooq.Tables.VACCINATION;

import app.healthfamily.domain.healthrecord.VaccinationRecord;
import app.healthfamily.domain.healthrecord.VaccinationSchedule;
import app.healthfamily.usecase.crud.OwnedCrudRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

/** ワクチン記録の永続化（jOOQ）。 */
@Repository
public class JooqVaccinationRepository implements OwnedCrudRepository<VaccinationRecord> {

    private final DSLContext dsl;

    public JooqVaccinationRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Optional<VaccinationRecord> findById(String id) {
        return dsl.select().from(VACCINATION).where(VACCINATION.ID.eq(id))
                .fetchOptional().map(JooqVaccinationRepository::toDomain);
    }

    @Override
    public List<VaccinationRecord> listByUser(String userId) {
        return dsl.select().from(VACCINATION)
                .where(VACCINATION.USERID.eq(userId))
                .orderBy(VACCINATION.VACCINATEDAT.desc())
                .fetch().map(JooqVaccinationRepository::toDomain);
    }

    @Override
    public void save(VaccinationRecord r) {
        var vaccinated = toOffset(r.schedule().vaccinatedAt());
        var next = toOffset(r.schedule().nextScheduledDate());
        dsl.insertInto(VACCINATION)
                .set(VACCINATION.ID, r.id())
                .set(VACCINATION.USERID, r.userId())
                .set(VACCINATION.MEMBERID, r.memberId())
                .set(VACCINATION.VACCINENAME, r.vaccineName())
                .set(VACCINATION.VACCINATEDAT, vaccinated)
                .set(VACCINATION.NEXTSCHEDULEDDATE, next)
                .set(VACCINATION.NOTES, r.notes())
                .onConflict(VACCINATION.ID)
                .doUpdate()
                .set(VACCINATION.VACCINENAME, r.vaccineName())
                .set(VACCINATION.VACCINATEDAT, vaccinated)
                .set(VACCINATION.NEXTSCHEDULEDDATE, next)
                .set(VACCINATION.NOTES, r.notes())
                .execute();
    }

    @Override
    public void deleteById(String id) {
        dsl.deleteFrom(VACCINATION).where(VACCINATION.ID.eq(id)).execute();
    }

    private static OffsetDateTime toOffset(LocalDate d) {
        return d == null ? null : OffsetDateTime.of(d.atStartOfDay(), ZoneOffset.UTC);
    }

    private static LocalDate toDate(OffsetDateTime t) {
        return t == null ? null : t.atZoneSameInstant(ZoneOffset.UTC).toLocalDate();
    }

    private static VaccinationRecord toDomain(Record r) {
        return new VaccinationRecord(
                r.get(VACCINATION.ID),
                r.get(VACCINATION.USERID),
                r.get(VACCINATION.MEMBERID),
                r.get(VACCINATION.VACCINENAME),
                VaccinationSchedule.of(
                        toDate(r.get(VACCINATION.VACCINATEDAT)),
                        toDate(r.get(VACCINATION.NEXTSCHEDULEDDATE))),
                r.get(VACCINATION.NOTES));
    }
}
