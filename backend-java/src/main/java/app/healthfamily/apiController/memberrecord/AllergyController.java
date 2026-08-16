package app.healthfamily.apiController.memberrecord;

import app.healthfamily.apiController.ApiResponse;
import app.healthfamily.domain.memberrecord.Allergy;
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
 * アレルギーのエンドポイント。
 *
 * <p>所有ユーザーはトークンの sub から取る。対象メンバーが自分のものかも確認するので、
 * 他人のメンバーに記録をぶら下げることはできない。
 */
@RestController
@RequestMapping("/api/allergies")
public class AllergyController {

    private final MemberScopedCrudUseCase<Allergy> useCase;

    public AllergyController(MemberScopedCrudUseCase<Allergy> useCase) {
        this.useCase = useCase;
    }

    @GetMapping
    public ApiResponse<List<Allergy>> list(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(useCase.list(jwt.getSubject()));
    }

    @GetMapping("/{id}")
    public ApiResponse<Allergy> get(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
        return ApiResponse.ok(useCase.get(jwt.getSubject(), id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Allergy> create(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AllergyRequest request) {
        var created =
                new Allergy(
                        UUID.randomUUID().toString(),
                        jwt.getSubject(),
                        request.memberId(),
                        request.allergenName(),
                        request.allergyType(),
                        request.severity(),
                        request.symptoms(),
                        request.notes());
        return ApiResponse.ok(useCase.create(jwt.getSubject(), created));
    }

    /** 指定された項目だけを差し替える。ID と所有者は変更できない。 */
    @PatchMapping("/{id}")
    public ApiResponse<Allergy> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String id,
            @RequestBody AllergyRequest request) {
        return ApiResponse.ok(
                useCase.update(
                        jwt.getSubject(),
                        id,
                        current ->
                                new Allergy(
                                        current.id(),
                                        current.userId(),
                                        pick(request.memberId(), current.memberId()),
                                        pick(request.allergenName(), current.allergenName()),
                                        pick(request.allergyType(), current.allergyType()),
                                        pick(request.severity(), current.severity()),
                                        pick(request.symptoms(), current.symptoms()),
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

    public record AllergyRequest(
            @Size(max = 100) String memberId,
            @Size(max = 500) String allergenName,
            @Size(max = 500) String allergyType,
            @Size(max = 500) String severity,
            @Size(max = 500) String symptoms,
            @Size(max = 500) String notes) {}
}
