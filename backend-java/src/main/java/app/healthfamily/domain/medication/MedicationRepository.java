package app.healthfamily.domain.medication;

import java.util.List;
import java.util.Optional;

/**
 * Medication 集約の永続化ポート。
 *
 * <p>ドメイン層に interface を置き、実装を infrastructure に置くことで、
 * 依存の向きを外から内へ保つ。ドメインは JDBC も SQL も知らない。
 */
public interface MedicationRepository {

    Optional<Medication> findById(String medicationId);

    /** 所有ユーザーの薬をすべて返す。 */
    List<Medication> listByUser(String userId);

    /** 集約の現在の状態を書き戻す。 */
    void save(Medication medication);
}
