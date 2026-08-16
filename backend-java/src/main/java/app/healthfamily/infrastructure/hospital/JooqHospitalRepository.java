package app.healthfamily.infrastructure.hospital;

import static app.healthfamily.infrastructure.jooq.Tables.HOSPITAL;

import app.healthfamily.domain.hospital.Hospital;
import app.healthfamily.usecase.crud.OwnedCrudRepository;
import java.util.List;
import java.util.Optional;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

/** 病院の永続化（jOOQ）。 */
@Repository
public class JooqHospitalRepository implements OwnedCrudRepository<Hospital> {

    private final DSLContext dsl;

    public JooqHospitalRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Optional<Hospital> findById(String id) {
        return dsl.select().from(HOSPITAL).where(HOSPITAL.ID.eq(id)).fetchOptional()
                .map(JooqHospitalRepository::toDomain);
    }

    @Override
    public List<Hospital> listByUser(String userId) {
        return dsl.select().from(HOSPITAL)
                .where(HOSPITAL.USERID.eq(userId))
                .orderBy(HOSPITAL.CREATEDAT.asc())
                .fetch()
                .map(JooqHospitalRepository::toDomain);
    }

    /** 挿入と更新を1つにまとめる。呼び出し側は存在を意識しなくてよい。 */
    @Override
    public void save(Hospital h) {
        dsl.insertInto(HOSPITAL)
                .set(HOSPITAL.ID, h.id())
                .set(HOSPITAL.USERID, h.userId())
                .set(HOSPITAL.NAME, h.name())
                .set(HOSPITAL.HOSPITALTYPE, h.hospitalType())
                .set(HOSPITAL.ADDRESS, h.address())
                .set(HOSPITAL.PHONENUMBER, h.phoneNumber())
                .set(HOSPITAL.DEPARTMENT, h.department())
                .set(HOSPITAL.DOCTORNAME, h.doctorName())
                .set(HOSPITAL.NOTES, h.notes())
                .onConflict(HOSPITAL.ID)
                .doUpdate()
                .set(HOSPITAL.NAME, h.name())
                .set(HOSPITAL.HOSPITALTYPE, h.hospitalType())
                .set(HOSPITAL.ADDRESS, h.address())
                .set(HOSPITAL.PHONENUMBER, h.phoneNumber())
                .set(HOSPITAL.DEPARTMENT, h.department())
                .set(HOSPITAL.DOCTORNAME, h.doctorName())
                .set(HOSPITAL.NOTES, h.notes())
                .execute();
    }

    @Override
    public void deleteById(String id) {
        dsl.deleteFrom(HOSPITAL).where(HOSPITAL.ID.eq(id)).execute();
    }

    private static Hospital toDomain(Record r) {
        return new Hospital(
                r.get(HOSPITAL.ID),
                r.get(HOSPITAL.USERID),
                r.get(HOSPITAL.NAME),
                r.get(HOSPITAL.HOSPITALTYPE),
                r.get(HOSPITAL.ADDRESS),
                r.get(HOSPITAL.PHONENUMBER),
                r.get(HOSPITAL.DEPARTMENT),
                r.get(HOSPITAL.DOCTORNAME),
                r.get(HOSPITAL.NOTES));
    }
}
