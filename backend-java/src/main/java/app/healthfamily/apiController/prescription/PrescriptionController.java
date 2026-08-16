package app.healthfamily.apiController.prescription;

import app.healthfamily.apiController.ApiResponse;
import app.healthfamily.domain.prescription.Prescription;
import app.healthfamily.usecase.prescription.DispensePrescriptionUseCase;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 処方箋のエンドポイント。
 *
 * <p>ユーザーIDは検証済みトークンの sub から取る。body にも path にも含めないので、
 * 他人の処方箋を名乗って操作することはできない。
 */
@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final DispensePrescriptionUseCase dispensePrescription;

    public PrescriptionController(DispensePrescriptionUseCase dispensePrescription) {
        this.dispensePrescription = dispensePrescription;
    }

    /** 明細をまるごと入れ替える。 */
    @PutMapping("/{prescriptionId}/items")
    public ApiResponse<Void> replaceItems(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String prescriptionId,
            @Valid @RequestBody ReplaceItemsRequest request) {
        dispensePrescription.replaceItems(
                new DispensePrescriptionUseCase.ReplaceItemsCommand(
                        jwt.getSubject(),
                        prescriptionId,
                        request.items().stream()
                                .map(i -> new Prescription.ItemDraft(i.name(), i.dosage(), i.frequency(), i.days()))
                                .toList()));
        return ApiResponse.ok(null);
    }

    /**
     * 調剤して服薬管理に登録する。
     *
     * <p>すべて成功するか、1 件も作られないかのどちらかになる。
     */
    @PostMapping("/{prescriptionId}/dispense")
    public ApiResponse<DispenseResponse> dispense(
            @AuthenticationPrincipal Jwt jwt, @PathVariable String prescriptionId) {
        var ids =
                dispensePrescription.execute(
                        new DispensePrescriptionUseCase.Command(jwt.getSubject(), prescriptionId));
        return ApiResponse.ok(new DispenseResponse(ids.size(), ids));
    }

    public record ReplaceItemsRequest(@NotEmpty List<ItemRequest> items) {}

    public record ItemRequest(
            @NotBlank String name, String dosage, String frequency, Integer days) {}

    public record DispenseResponse(int createdCount, List<String> medicationIds) {}
}
