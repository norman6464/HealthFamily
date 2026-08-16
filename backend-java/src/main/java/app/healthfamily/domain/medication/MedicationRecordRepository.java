package app.healthfamily.domain.medication;

import java.time.Instant;
import java.util.Optional;

/** 服薬記録の永続化ポート。 */
public interface MedicationRecordRepository {

    /**
     * その薬の直近の服用時刻。まだ一度も服用していなければ空。
     *
     * <p>服用間隔の判定に使う。集約に記録を含めない代わりに、
     * 必要な一点だけをここから取り出してアプリケーション層が集約へ渡す。
     */
    Optional<Instant> findLastTakenAt(String medicationId);

    /** 記録を1件追加する。 */
    void append(MedicationRecord record);
}
