package app.healthfamily.usecase.member;

import app.healthfamily.domain.member.Member;
import app.healthfamily.domain.member.MemberRepository;
import app.healthfamily.domain.member.MemberType;
import app.healthfamily.domain.member.PetType;
import app.healthfamily.domain.shared.AppZone;
import app.healthfamily.domain.shared.DomainException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * メンバーの登録と参照。
 *
 * <p>種別と動物種別の整合や未来日の検証は集約が持つ。ここは読み書きの手順だけを担う。
 */
@Service
public class MemberUseCase {

    private final MemberRepository members;
    private final AppZone zone;

    public MemberUseCase(MemberRepository members, AppZone zone) {
        this.members = members;
        this.zone = zone;
    }

    @Transactional
    public View register(RegisterCommand command) {
        LocalDate today = zone.today();
        Member member =
                Member.builder()
                        .id(UUID.randomUUID().toString())
                        .userId(command.userId())
                        .name(command.name())
                        .type(MemberType.fromCode(command.memberType()))
                        .petType(command.petType() == null ? null : PetType.fromCode(command.petType()))
                        .birthDate(command.birthDate())
                        .photoUrl(command.photoUrl())
                        .notes(command.notes())
                        .build(today);

        members.create(member);
        return View.of(member, today);
    }

    @Transactional(readOnly = true)
    public List<View> list(String userId) {
        LocalDate today = zone.today();
        return members.listByUser(userId).stream().map(m -> View.of(m, today)).toList();
    }

    @Transactional(readOnly = true)
    public View get(String userId, String memberId) {
        Member member =
                members.findById(memberId).orElseThrow(() -> DomainException.notFound("メンバー"));
        member.requireOwnedBy(userId);
        return View.of(member, zone.today());
    }

    /** @param age 生年月日から算出した満年齢。未設定なら null */
    public record View(
            String id,
            String name,
            String memberType,
            String petType,
            LocalDate birthDate,
            Integer age,
            String photoUrl,
            String notes) {

        static View of(Member m, LocalDate today) {
            return new View(
                    m.id(),
                    m.name(),
                    m.type().code(),
                    m.petType().map(PetType::code).orElse(null),
                    m.birthDate().orElse(null),
                    m.ageAt(today).orElse(null),
                    m.photoUrl().orElse(null),
                    m.notes().orElse(null));
        }
    }

    public record RegisterCommand(
            String userId,
            String name,
            String memberType,
            String petType,
            LocalDate birthDate,
            String photoUrl,
            String notes) {}
}
