package app.healthfamily.infrastructure.memberrecord;

import static app.healthfamily.infrastructure.jooq.Tables.EMERGENCYCONTACT;

import app.healthfamily.domain.memberrecord.EmergencyContact;
import app.healthfamily.usecase.crud.OwnedCrudRepository;
import java.util.List;
import java.util.Optional;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

/** EmergencyContact の永続化（jOOQ）。 */
@Repository
public class JooqEmergencyContactRepository implements OwnedCrudRepository<EmergencyContact> {

    private final DSLContext dsl;

    public JooqEmergencyContactRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Optional<EmergencyContact> findById(String id) {
        return dsl.select().from(EMERGENCYCONTACT).where(EMERGENCYCONTACT.ID.eq(id)).fetchOptional()
                .map(JooqEmergencyContactRepository::toDomain);
    }

    @Override
    public List<EmergencyContact> listByUser(String userId) {
        return dsl.select().from(EMERGENCYCONTACT)
                .where(EMERGENCYCONTACT.USERID.eq(userId))
                .orderBy(EMERGENCYCONTACT.CREATEDAT.asc())
                .fetch()
                .map(JooqEmergencyContactRepository::toDomain);
    }

    /** 挿入と更新を1つにまとめる。呼び出し側は存在を意識しなくてよい。 */
    @Override
    public void save(EmergencyContact e) {
        dsl.insertInto(EMERGENCYCONTACT)
                .set(EMERGENCYCONTACT.ID, e.id())
                .set(EMERGENCYCONTACT.USERID, e.userId())
                .set(EMERGENCYCONTACT.MEMBERID, e.memberId())
                .set(EMERGENCYCONTACT.CONTACTNAME, e.contactName())
                .set(EMERGENCYCONTACT.PHONENUMBER, e.phoneNumber())
                .set(EMERGENCYCONTACT.RELATIONSHIP, e.relationship())
                .set(EMERGENCYCONTACT.NOTES, e.notes())
                .onConflict(EMERGENCYCONTACT.ID)
                .doUpdate()
                .set(EMERGENCYCONTACT.CONTACTNAME, e.contactName())
                .set(EMERGENCYCONTACT.PHONENUMBER, e.phoneNumber())
                .set(EMERGENCYCONTACT.RELATIONSHIP, e.relationship())
                .set(EMERGENCYCONTACT.NOTES, e.notes())
                .execute();
    }

    @Override
    public void deleteById(String id) {
        dsl.deleteFrom(EMERGENCYCONTACT).where(EMERGENCYCONTACT.ID.eq(id)).execute();
    }

    private static EmergencyContact toDomain(Record r) {
        return new EmergencyContact(
                r.get(EMERGENCYCONTACT.ID),
                r.get(EMERGENCYCONTACT.USERID),
                r.get(EMERGENCYCONTACT.MEMBERID),
                r.get(EMERGENCYCONTACT.CONTACTNAME),
                r.get(EMERGENCYCONTACT.PHONENUMBER),
                r.get(EMERGENCYCONTACT.RELATIONSHIP),
                r.get(EMERGENCYCONTACT.NOTES));
    }
}
