package app.healthfamily.medication.web;

import app.healthfamily.medication.application.ListMedicationsUseCase;
import app.healthfamily.medication.application.TakeMedicationUseCase;
import app.healthfamily.medication.domain.MedicationRecord;
import app.healthfamily.shared.web.ApiResponse;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 薬のエンドポイント。
 *
 * <p>ユーザーIDは検証済みトークンの sub から取る。リクエストボディで受け取ると
 * 他人のIDを名乗れてしまうため、body にも path にも含めない。
 */
@RestController
@RequestMapping("/api/medications")
public class MedicationController {

    private final TakeMedicationUseCase takeMedication;
    private final ListMedicationsUseCase listMedications;

    public MedicationController(
            TakeMedicationUseCase takeMedication, ListMedicationsUseCase listMedications) {
        this.takeMedication = takeMedication;
        this.listMedications = listMedications;
    }

    @GetMapping
    public ApiResponse<List<ListMedicationsUseCase.View>> list(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(listMedications.listAll(jwt.getSubject()));
    }

    /** 残数が少ない薬。判定はサーバー側で行う。 */
    @GetMapping("/alerts")
    public ApiResponse<List<ListMedicationsUseCase.View>> alerts(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(listMedications.listLowStock(jwt.getSubject()));
    }

    /**
     * 1 回ぶん服用したことを記録する。
     *
     * <p>残数の減算・服用間隔の確認・記録の作成が 1 トランザクションで行われる。
     * 集約が拒否した場合は 409 を返し、何も書き込まれない。
     */
    @PostMapping("/{medicationId}/take")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RecordResponse> take(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String medicationId,
            @RequestBody(required = false) TakeRequest request) {
        var record =
                takeMedication.execute(
                        new TakeMedicationUseCase.Command(
                                jwt.getSubject(),
                                medicationId,
                                request == null ? null : request.notes()));
        return ApiResponse.ok(RecordResponse.of(record));
    }

    /** @param notes 任意のメモ。「頭痛のため」など */
    public record TakeRequest(@Size(max = 500) String notes) {}

    public record RecordResponse(
            String id,
            String medicationId,
            String memberId,
            Instant takenAt,
            String dosageAmount,
            String notes) {

        static RecordResponse of(MedicationRecord r) {
            return new RecordResponse(
                    r.id(), r.medicationId(), r.memberId(), r.takenAt(), r.dosageAmount(), r.notes());
        }
    }
}
