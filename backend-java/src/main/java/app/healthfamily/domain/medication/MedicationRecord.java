package app.healthfamily.domain.medication;

import java.time.Instant;

/**
 * 服薬記録。
 *
 * <p>Medication 集約とは別のライフサイクルを持つ（件数が無制限に増える）ため、
 * 独立した集約として扱う。参照は ID のみで、オブジェクト参照は持たせない。
 *
 * @param scheduleId 定時薬のスケジュールに紐づく場合のみ。頓服では null
 */
public record MedicationRecord(
        String id,
        String medicationId,
        String memberId,
        String userId,
        String scheduleId,
        Instant takenAt,
        String dosageAmount,
        String notes) {

    /** {@link DoseTaken} から、まだ採番されていない記録を組み立てる。 */
    public static MedicationRecord from(String id, DoseTaken taken, String notes) {
        return new MedicationRecord(
                id,
                taken.medicationId(),
                taken.memberID(),
                taken.userId(),
                null,
                taken.takenAt(),
                taken.dosageAmount().orElse(null),
                notes);
    }
}
