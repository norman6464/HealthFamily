package app.healthfamily.medication.domain;

import java.time.Instant;
import java.util.Optional;

/**
 * 服用が成立したことを表す。
 *
 * <p>{@link Medication#take} の戻り値。集約が「何が起きたか」を返し、
 * それを永続化するのはアプリケーション層の仕事とする。
 * ドメイン層はリポジトリを呼ばない。
 *
 * @param medicationId   服用した薬
 * @param memberID       対象メンバー（薬から導出するので呼び出し側が指定する必要はない）
 * @param userId         所有ユーザー
 * @param takenAt        服用時刻
 * @param dosageAmount   服用量。薬に設定がなければ空
 * @param remainingStock 服用後の残数。残数を管理していない薬なら空
 */
public record DoseTaken(
        String medicationId,
        String memberID,
        String userId,
        Instant takenAt,
        Optional<String> dosageAmount,
        Optional<StockQuantity> remainingStock) {

    public DoseTaken {
        if (medicationId == null || medicationId.isBlank()) {
            throw new IllegalArgumentException("medicationId is required");
        }
        if (takenAt == null) {
            throw new IllegalArgumentException("takenAt is required");
        }
    }

    /** 残数を管理していて、かつ服用後に 0 になったか。 */
    public boolean depletedStock() {
        return remainingStock.map(StockQuantity::isEmpty).orElse(false);
    }
}
