package app.healthfamily.apiController.memberrecord;

import app.healthfamily.apiController.ApiResponse;
import app.healthfamily.domain.memberrecord.EmergencyContact;
import app.healthfamily.usecase.crud.MemberScopedCrudUseCase;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 緊急連絡先のエンドポイント。
 *
 * <p>所有ユーザーはトークンの sub から取る。対象メンバーが自分のものかも確認するので、
 * 他人のメンバーに記録をぶら下げることはできない。
 */
@RestController
@RequestMapping("/api/emergency-contacts")
public class EmergencyContactController {

    private final MemberScopedCrudUseCase<EmergencyContact> useCase;

    public EmergencyContactController(MemberScopedCrudUseCase<EmergencyContact> useCase) {
        this.useCase = useCase;
    }

    @GetMapping
    public ApiResponse<List<EmergencyContact>> list(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(useCase.list(jwt.getSubject()));
    }

    @GetMapping("/{id}")
    public ApiResponse<EmergencyContact> get(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
        return ApiResponse.ok(useCase.get(jwt.getSubject(), id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EmergencyContact> create(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody EmergencyContactRequest request) {
        var created =
                new EmergencyContact(
                        UUID.randomUUID().toString(),
                        jwt.getSubject(),
                        request.memberId(),
                        request.contactName(),
                        request.phoneNumber(),
                        request.relationship(),
                        request.notes());
        return ApiResponse.ok(useCase.create(jwt.getSubject(), created));
    }

    /** 指定された項目だけを差し替える。ID と所有者は変更できない。 */
    @PatchMapping("/{id}")
    public ApiResponse<EmergencyContact> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id,
            @RequestBody EmergencyContactRequest request) {
        return ApiResponse.ok(
                useCase.update(
                        jwt.getSubject(),
                        id,
                        current ->
                                new EmergencyContact(
                                        current.id(),
                                        current.userId(),
                                        pick(request.memberId(), current.memberId()),
                                        pick(request.contactName(), current.contactName()),
                                        pick(request.phoneNumber(), current.phoneNumber()),
                                        pick(request.relationship(), current.relationship()),
                                        pick(request.notes(), current.notes()))));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
        useCase.delete(jwt.getSubject(), id);
    }

    private static String pick(String incoming, String current) {
        return incoming == null ? current : incoming;
    }

    public record EmergencyContactRequest(
            @Size(max = 100) String memberId,
            @Size(max = 500) String contactName,
            @Size(max = 500) String phoneNumber,
            @Size(max = 500) String relationship,
            @Size(max = 500) String notes) {}
}
