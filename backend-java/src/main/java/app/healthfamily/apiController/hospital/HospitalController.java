package app.healthfamily.apiController.hospital;

import app.healthfamily.apiController.ApiResponse;
import app.healthfamily.domain.hospital.Hospital;
import app.healthfamily.usecase.crud.OwnedCrudUseCase;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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
 * かかりつけ病院のエンドポイント。
 *
 * <p>所有ユーザーは検証済みトークンの sub から取る。読み書きはすべて
 * {@link OwnedCrudUseCase} を通すので、所有権チェックが抜ける経路が無い。
 */
@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    private final OwnedCrudUseCase<Hospital> hospitals;

    public HospitalController(OwnedCrudUseCase<Hospital> hospitals) {
        this.hospitals = hospitals;
    }

    @GetMapping
    public ApiResponse<List<Hospital>> list(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(hospitals.list(jwt.getSubject()));
    }

    @GetMapping("/{hospitalId}")
    public ApiResponse<Hospital> get(
            @AuthenticationPrincipal Jwt jwt, @PathVariable String hospitalId) {
        return ApiResponse.ok(hospitals.get(jwt.getSubject(), hospitalId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Hospital> create(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody HospitalRequest request) {
        var hospital =
                new Hospital(
                        UUID.randomUUID().toString(),
                        jwt.getSubject(),
                        request.name(),
                        request.hospitalType(),
                        request.address(),
                        request.phoneNumber(),
                        request.department(),
                        request.doctorName(),
                        request.notes());
        return ApiResponse.ok(hospitals.create(jwt.getSubject(), hospital));
    }

    /** 指定された項目だけを差し替える。ID と所有者は変更できない。 */
    @PatchMapping("/{hospitalId}")
    public ApiResponse<Hospital> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String hospitalId,
            @RequestBody HospitalRequest request) {
        return ApiResponse.ok(
                hospitals.update(
                        jwt.getSubject(),
                        hospitalId,
                        current ->
                                new Hospital(
                                        current.id(),
                                        current.userId(),
                                        request.name() == null ? current.name() : request.name(),
                                        pick(request.hospitalType(), current.hospitalType()),
                                        pick(request.address(), current.address()),
                                        pick(request.phoneNumber(), current.phoneNumber()),
                                        pick(request.department(), current.department()),
                                        pick(request.doctorName(), current.doctorName()),
                                        pick(request.notes(), current.notes()))));
    }

    @DeleteMapping("/{hospitalId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable String hospitalId) {
        hospitals.delete(jwt.getSubject(), hospitalId);
    }

    private static String pick(String incoming, String current) {
        return incoming == null ? current : incoming;
    }

    /** 作成時は name が必須。更新時は指定された項目だけを差し替える。 */
    public record HospitalRequest(
            @Size(max = 200) String name,
            @Size(max = 50) String hospitalType,
            @Size(max = 500) String address,
            @Size(max = 50) String phoneNumber,
            @Size(max = 100) String department,
            @Size(max = 100) String doctorName,
            @Size(max = 2000) String notes) {}
}
