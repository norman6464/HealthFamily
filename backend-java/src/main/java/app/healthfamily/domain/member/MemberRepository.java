package app.healthfamily.domain.member;

import java.util.List;
import java.util.Optional;

/** メンバー集約の永続化ポート。 */
public interface MemberRepository {

    Optional<Member> findById(String memberId);

    List<Member> listByUser(String userId);

    void create(Member member);
}
