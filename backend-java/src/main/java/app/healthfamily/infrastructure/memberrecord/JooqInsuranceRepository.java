package app.healthfamily.infrastructure.memberrecord;

import static app.healthfamily.infrastructure.jooq.Tables.INSURANCE;

import app.healthfamily.domain.memberrecord.Insurance;
import app.healthfamily.usecase.crud.OwnedCrudRepository;
import java.util.List;
import java.util.Optional;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

/** Insurance の永続化（jOOQ）。 */
@Repository
public class JooqInsuranceRepository implements OwnedCrudRepository<Insurance> {

    private final DSLContext dsl;

    public JooqInsuranceRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Optional<Insurance> findById(String id) {
        return dsl.select().from(INSURANCE).where(INSURANCE.ID.eq(id)).fetchOptional()
                .map(JooqInsuranceRepository::toDomain);
    }

    @Override
    public List<Insurance> listByUser(String userId) {
        return dsl.select().from(INSURANCE)
                .where(INSURANCE.USERID.eq(userId))
                .orderBy(INSURANCE.CREATEDAT.asc())
                .fetch()
                .map(JooqInsuranceRepository::toDomain);
    }

    /** 挿入と更新を1つにまとめる。呼び出し側は存在を意識しなくてよい。 */
    @Override
    public void save(Insurance e) {
        dsl.insertInto(INSURANCE)
                .set(INSURANCE.ID, e.id())
                .set(INSURANCE.USERID, e.userId())
                .set(INSURANCE.MEMBERID, e.memberId())
                .set(INSURANCE.INSURANCETYPE, e.insuranceType())
                .set(INSURANCE.PROVIDERNAME, e.providerName())
                .set(INSURANCE.POLICYNUMBER, e.policyNumber())
                .set(INSURANCE.NOTES, e.notes())
                .onConflict(INSURANCE.ID)
                .doUpdate()
                .set(INSURANCE.INSURANCETYPE, e.insuranceType())
                .set(INSURANCE.PROVIDERNAME, e.providerName())
                .set(INSURANCE.POLICYNUMBER, e.policyNumber())
                .set(INSURANCE.NOTES, e.notes())
                .execute();
    }

    @Override
    public void deleteById(String id) {
        dsl.deleteFrom(INSURANCE).where(INSURANCE.ID.eq(id)).execute();
    }

    private static Insurance toDomain(Record r) {
        return new Insurance(
                r.get(INSURANCE.ID),
                r.get(INSURANCE.USERID),
                r.get(INSURANCE.MEMBERID),
                r.get(INSURANCE.INSURANCETYPE),
                r.get(INSURANCE.PROVIDERNAME),
                r.get(INSURANCE.POLICYNUMBER),
                r.get(INSURANCE.NOTES));
    }
}
