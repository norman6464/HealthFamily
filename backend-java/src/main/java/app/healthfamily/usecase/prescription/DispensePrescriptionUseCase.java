package app.healthfamily.usecase.prescription;

import app.healthfamily.domain.medication.MedicationFactory;
import app.healthfamily.domain.prescription.Prescription;
import app.healthfamily.domain.prescription.PrescriptionRepository;
import app.healthfamily.domain.shared.DomainException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 処方箋の明細操作と調剤。
 *
 * <p>調剤は <b>1 トランザクション</b>で行う。明細を 1 件ずつ登録していく実装では、
 * 途中で失敗したときに先に作られた薬だけが残る。処方箋は「まとめて調剤される」ものなので、
 * 部分的に成立した状態を作ってはならない。
 */
@Service
public class DispensePrescriptionUseCase {

    private final PrescriptionRepository prescriptions;
    private final MedicationFactory medications;

    public DispensePrescriptionUseCase(
            PrescriptionRepository prescriptions, MedicationFactory medications) {
        this.prescriptions = prescriptions;
        this.medications = medications;
    }

    /** 調剤して、作られた薬のIDを返す。 */
    @Transactional
    public List<String> execute(Command command) {
        Prescription prescription = load(command.userId(), command.prescriptionId());

        List<MedicationFactory.NewMedication> orders =
                prescription.dispense().stream()
                        .map(
                                o ->
                                        new MedicationFactory.NewMedication(
                                                o.memberId(), o.userId(), o.name(), o.dosage(), o.frequency()))
                        .toList();

        return medications.createAll(orders);
    }

    /** 明細をまるごと入れ替える。 */
    @Transactional
    public void replaceItems(ReplaceItemsCommand command) {
        Prescription prescription = load(command.userId(), command.prescriptionId());
        prescription.replaceItems(command.items(), () -> UUID.randomUUID().toString());
        prescriptions.saveItems(prescription);
    }

    private Prescription load(String userId, String prescriptionId) {
        Prescription prescription =
                prescriptions
                        .findById(prescriptionId)
                        .orElseThrow(() -> DomainException.notFound("処方箋"));
        prescription.requireOwnedBy(userId);
        return prescription;
    }

    public record Command(String userId, String prescriptionId) {}

    public record ReplaceItemsCommand(
            String userId, String prescriptionId, List<Prescription.ItemDraft> items) {}
}
