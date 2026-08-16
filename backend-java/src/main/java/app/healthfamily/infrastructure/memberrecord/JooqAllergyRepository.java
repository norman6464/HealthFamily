package app.healthfamily.infrastructure.memberrecord;

import static app.healthfamily.infrastructure.jooq.Tables.ALLERGY;

import app.healthfamily.domain.memberrecord.Allergy;
import app.healthfamily.usecase.crud.OwnedCrudRepository;
import java.util.List;
import java.util.Optional;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

/** Allergy の永続化（jOOQ）。 */
@Repository
public class JooqAllergyRepository implements OwnedCrudRepository<Allergy> {

    private final DSLContext dsl;

    public JooqAllergyRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Optional<Allergy> findById(String id) {
        return dsl.select().from(ALLERGY).where(ALLERGY.ID.eq(id)).fetchOptional()
                .map(JooqAllergyRepository::toDomain);
    }

    @Override
    public List<Allergy> listByUser(String userId) {
        return dsl.select().from(ALLERGY)
                .where(ALLERGY.USERID.eq(userId))
                .orderBy(ALLERGY.CREATEDAT.asc())
                .fetch()
                .map(JooqAllergyRepository::toDomain);
    }

    /** 挿入と更新を1つにまとめる。呼び出し側は存在を意識しなくてよい。 */
    @Override
    public void save(Allergy e) {
        dsl.insertInto(ALLERGY)
                .set(ALLERGY.ID, e.id())
                .set(ALLERGY.USERID, e.userId())
                .set(ALLERGY.MEMBERID, e.memberId())
                .set(ALLERGY.ALLERGENNAME, e.allergenName())
                .set(ALLERGY.ALLERGYTYPE, e.allergyType())
                .set(ALLERGY.SEVERITY, e.severity())
                .set(ALLERGY.SYMPTOMS, e.symptoms())
                .set(ALLERGY.NOTES, e.notes())
                .onConflict(ALLERGY.ID)
                .doUpdate()
                .set(ALLERGY.ALLERGENNAME, e.allergenName())
                .set(ALLERGY.ALLERGYTYPE, e.allergyType())
                .set(ALLERGY.SEVERITY, e.severity())
                .set(ALLERGY.SYMPTOMS, e.symptoms())
                .set(ALLERGY.NOTES, e.notes())
                .execute();
    }

    @Override
    public void deleteById(String id) {
        dsl.deleteFrom(ALLERGY).where(ALLERGY.ID.eq(id)).execute();
    }

    private static Allergy toDomain(Record r) {
        return new Allergy(
                r.get(ALLERGY.ID),
                r.get(ALLERGY.USERID),
                r.get(ALLERGY.MEMBERID),
                r.get(ALLERGY.ALLERGENNAME),
                r.get(ALLERGY.ALLERGYTYPE),
                r.get(ALLERGY.SEVERITY),
                r.get(ALLERGY.SYMPTOMS),
                r.get(ALLERGY.NOTES));
    }
}
