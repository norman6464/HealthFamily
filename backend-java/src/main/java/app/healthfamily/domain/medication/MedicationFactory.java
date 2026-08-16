package app.healthfamily.domain.medication;

import java.util.List;

/**
 * 調剤などで薬をまとめて登録するためのポート。
 *
 * <p>1 件ずつ登録すると途中失敗で中途半端な状態が残るため、
 * 「まとめて登録する」ことを型で表している。
 */
public interface MedicationFactory {

    /** @param orders 登録する薬の内容。空でないこと */
    List<String> createAll(List<NewMedication> orders);

    /**
     * 新しく登録する薬の内容。
     *
     * <p>調剤で作る薬は定時薬として登録する。頓服かどうかは処方明細からは判断できず、
     * 利用者が後から変更する運用にしている。
     */
    record NewMedication(
            String memberId, String userId, String name, String dosage, String frequency) {}
}
