package app.healthfamily.config;

import app.healthfamily.domain.hospital.Hospital;
import app.healthfamily.domain.member.MemberRepository;
import app.healthfamily.domain.memberrecord.Allergy;
import app.healthfamily.domain.memberrecord.EmergencyContact;
import app.healthfamily.domain.memberrecord.Insurance;
import app.healthfamily.usecase.crud.MemberScopedCrudUseCase;
import app.healthfamily.usecase.crud.OwnedCrudRepository;
import app.healthfamily.usecase.crud.OwnedCrudUseCase;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 所有者を持つだけの資源のユースケースを組み立てる。
 *
 * <p>資源名はここで与える。利用者向けのメッセージに出るため、
 * 資源が増えるたびにこの1箇所を見れば全体が分かるようにしている。
 *
 * <p>メンバーに紐づく資源は MemberScopedCrudUseCase を使う。
 * 他人のメンバーへ記録をぶら下げられないようにするため。
 */
@Configuration
public class CrudUseCaseConfig {

    @Bean
    public OwnedCrudUseCase<Hospital> hospitalUseCase(OwnedCrudRepository<Hospital> repository) {
        return new OwnedCrudUseCase<>(repository, "病院");
    }

    @Bean
    public MemberScopedCrudUseCase<Allergy> allergyUseCase(
            OwnedCrudRepository<Allergy> repository, MemberRepository members) {
        return new MemberScopedCrudUseCase<>(repository, members, Allergy::memberId, "アレルギー");
    }

    @Bean
    public MemberScopedCrudUseCase<EmergencyContact> emergencyContactUseCase(
            OwnedCrudRepository<EmergencyContact> repository, MemberRepository members) {
        return new MemberScopedCrudUseCase<>(
                repository, members, EmergencyContact::memberId, "緊急連絡先");
    }

    @Bean
    public MemberScopedCrudUseCase<Insurance> insuranceUseCase(
            OwnedCrudRepository<Insurance> repository, MemberRepository members) {
        return new MemberScopedCrudUseCase<>(repository, members, Insurance::memberId, "保険");
    }
}
