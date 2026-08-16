package app.healthfamily.medication.application;

import app.healthfamily.medication.domain.Medication;
import app.healthfamily.medication.domain.MedicationRepository;
import app.healthfamily.shared.AppZone;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 薬の一覧と残数アラートを返すユースケース。
 *
 * <p>残数が少ないかどうかの判定は、これまでフロントの
 * MemberMedications.tsx の中で行われていた。判定に使う「今日」が
 * 端末の時計とタイムゾーンに依存していたため、サーバー側へ引き上げる。
 */
@Service
public class ListMedicationsUseCase {

    private final MedicationRepository medications;
    private final AppZone zone;

    public ListMedicationsUseCase(MedicationRepository medications, AppZone zone) {
        this.medications = medications;
        this.zone = zone;
    }

    @Transactional(readOnly = true)
    public List<View> listAll(String userId) {
        LocalDate today = zone.today();
        return medications.listByUser(userId).stream().map(m -> View.of(m, today)).toList();
    }

    /** 残数が少ないものだけを返す。 */
    @Transactional(readOnly = true)
    public List<View> listLowStock(String userId) {
        return listAll(userId).stream().filter(View::lowStock).toList();
    }

    /**
     * 一覧表示に必要なだけの読み取り用の形。
     *
     * <p>集約そのものを外へ出さない。JSON の都合でドメインが歪むのを避けるため。
     */
    public record View(
            String id,
            String memberId,
            String name,
            String category,
            String status,
            Integer stockQuantity,
            Integer intervalHours,
            String dosageAmount,
            boolean lowStock) {

        static View of(Medication m, LocalDate today) {
            return new View(
                    m.id(),
                    m.memberId(),
                    m.name(),
                    m.category().code(),
                    m.status().code(),
                    m.stock().map(s -> s.value()).orElse(null),
                    m.interval().map(i -> i.hours()).orElse(null),
                    m.dosageAmount().orElse(null),
                    m.isLowStock(today));
        }
    }
}
