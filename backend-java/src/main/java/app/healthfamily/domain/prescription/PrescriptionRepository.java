package app.healthfamily.domain.prescription;

import java.util.Optional;

/**
 * 処方箋集約の永続化ポート。
 *
 * <p>明細は集約の一部なので、読み書きは常に処方箋ごと行う。
 * 明細だけを個別に更新する口は用意しない。集約の外から不変条件を破らせないため。
 */
public interface PrescriptionRepository {

    /** 明細も含めて読み出す。 */
    Optional<Prescription> findById(String prescriptionId);

    /** 明細をまるごと置き換える形で保存する。 */
    void saveItems(Prescription prescription);
}
