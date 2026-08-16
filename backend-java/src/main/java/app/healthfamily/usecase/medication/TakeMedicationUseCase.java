package app.healthfamily.usecase.medication;

import app.healthfamily.domain.medication.DoseTaken;
import app.healthfamily.domain.medication.Medication;
import app.healthfamily.domain.medication.MedicationRecord;
import app.healthfamily.domain.medication.MedicationRecordRepository;
import app.healthfamily.domain.medication.MedicationRepository;
import app.healthfamily.domain.shared.DomainException;
import java.time.Clock;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 「薬を服用した」を記録するユースケース。
 *
 * <p>このクラスの仕事は 4 つだけで、判断はすべて集約に任せている。
 *
 * <ol>
 *   <li>集約と、判断に必要な外部の値（前回服用時刻）を読み出す</li>
 *   <li>所有権を確認する</li>
 *   <li>集約のメソッドを呼ぶ</li>
 *   <li>結果を書き戻す</li>
 * </ol>
 *
 * <p>残数の減算と記録の追加は <b>1 つのトランザクション</b>にまとまっている。
 * Go 版はトランザクションがリポジトリの内側にしかなく、ユースケースが
 * 複数リポジトリをまたげなかったため、この原子性を確保できなかった。
 */
@Service
public class TakeMedicationUseCase {

    private final MedicationRepository medications;
    private final MedicationRecordRepository records;
    private final Clock clock;

    public TakeMedicationUseCase(
            MedicationRepository medications, MedicationRecordRepository records, Clock clock) {
        this.medications = medications;
        this.records = records;
        this.clock = clock;
    }

    @Transactional
    public MedicationRecord execute(Command command) {
        Medication medication =
                medications
                        .findById(command.medicationId())
                        .orElseThrow(() -> DomainException.notFound("薬"));
        medication.requireOwnedBy(command.userId());

        Optional<java.time.Instant> lastTakenAt =
                records.findLastTakenAt(command.medicationId());

        DoseTaken taken = medication.take(clock.instant(), lastTakenAt);

        medications.save(medication);
        MedicationRecord record =
                MedicationRecord.from(UUID.randomUUID().toString(), taken, command.notes());
        records.append(record);
        return record;
    }

    /** @param notes 任意のメモ。未指定なら null */
    public record Command(String userId, String medicationId, String notes) {

        public Command {
            if (userId == null || userId.isBlank()) {
                throw DomainException.validation("ユーザーIDは必須です");
            }
            if (medicationId == null || medicationId.isBlank()) {
                throw DomainException.validation("薬のIDは必須です");
            }
        }
    }
}
