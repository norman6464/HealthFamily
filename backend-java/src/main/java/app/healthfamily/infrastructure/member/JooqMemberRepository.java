package app.healthfamily.infrastructure.member;

import static app.healthfamily.infrastructure.jooq.Tables.MEMBER;

import app.healthfamily.domain.member.Member;
import app.healthfamily.domain.member.MemberRepository;
import app.healthfamily.domain.member.MemberType;
import app.healthfamily.domain.member.PetType;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

/** メンバー集約の永続化（jOOQ）。 */
@Repository
public class JooqMemberRepository implements MemberRepository {

    private final DSLContext dsl;

    public JooqMemberRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Optional<Member> findById(String memberId) {
        return dsl.select()
                .from(MEMBER)
                .where(MEMBER.ID.eq(memberId))
                .fetchOptional()
                .map(JooqMemberRepository::toAggregate);
    }

    @Override
    public List<Member> listByUser(String userId) {
        return dsl.select()
                .from(MEMBER)
                .where(MEMBER.USERID.eq(userId))
                .orderBy(MEMBER.CREATEDAT.asc())
                .fetch()
                .map(JooqMemberRepository::toAggregate);
    }

    @Override
    public void create(Member member) {
        dsl.insertInto(MEMBER)
                .set(MEMBER.ID, member.id())
                .set(MEMBER.USERID, member.userId())
                .set(MEMBER.NAME, member.name())
                .set(MEMBER.MEMBERTYPE, member.type().code())
                .set(MEMBER.PETTYPE, member.petType().map(PetType::code).orElse(null))
                .set(
                        MEMBER.BIRTHDATE,
                        member.birthDate()
                                .map(d -> OffsetDateTime.of(d.atStartOfDay(), ZoneOffset.UTC))
                                .orElse(null))
                .set(MEMBER.PHOTOURL, member.photoUrl().orElse(null))
                .set(MEMBER.NOTES, member.notes().orElse(null))
                .set(MEMBER.UPDATEDAT, OffsetDateTime.now(ZoneOffset.UTC))
                .execute();
    }

    /**
     * 行から集約を再構築する。
     *
     * <p>生年月日は timestamptz だが日付として書かれているため、書かれ方に合わせて UTC で落とす。
     * 未来日チェックは行わない。既に保存されている値を読めなくしても意味がないため。
     */
    private static Member toAggregate(Record row) {
        var builder =
                Member.builder()
                        .id(row.get(MEMBER.ID))
                        .userId(row.get(MEMBER.USERID))
                        .name(row.get(MEMBER.NAME))
                        .type(MemberType.fromCode(row.get(MEMBER.MEMBERTYPE)))
                        .photoUrl(row.get(MEMBER.PHOTOURL))
                        .notes(row.get(MEMBER.NOTES));

        String petType = row.get(MEMBER.PETTYPE);
        if (petType != null && !petType.isBlank()) {
            builder.petType(PetType.fromCode(petType));
        }
        OffsetDateTime birth = row.get(MEMBER.BIRTHDATE);
        if (birth != null) {
            builder.birthDate(birth.atZoneSameInstant(ZoneOffset.UTC).toLocalDate());
        }
        return builder.build();
    }
}
