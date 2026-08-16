package app.healthfamily.config;

import app.healthfamily.domain.hospital.Hospital;
import app.healthfamily.usecase.crud.OwnedCrudRepository;
import app.healthfamily.usecase.crud.OwnedCrudUseCase;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 所有者を持つだけの資源のユースケースを組み立てる。
 *
 * <p>資源名はここで与える。利用者向けのメッセージに出るため、
 * 資源が増えるたびにこの1箇所を見れば全体が分かるようにしている。
 */
@Configuration
public class CrudUseCaseConfig {

    @Bean
    public OwnedCrudUseCase<Hospital> hospitalUseCase(OwnedCrudRepository<Hospital> repository) {
        return new OwnedCrudUseCase<>(repository, "病院");
    }
}
