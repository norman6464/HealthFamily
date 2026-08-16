package app.healthfamily.apiController.member;

import app.healthfamily.apiController.ApiResponse;
import app.healthfamily.usecase.member.MemberUseCase;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
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
 * メンバーのエンドポイント。
 *
 * <p>所有ユーザーは検証済みトークンの sub から取る。リクエストで受け取らないので、
 * 他人のメンバーとして登録することはできない。
 */
@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberUseCase memberUseCase;

    public MemberController(MemberUseCase memberUseCase) {
        this.memberUseCase = memberUseCase;
    }

    @GetMapping
    public ApiResponse<List<MemberUseCase.View>> list(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(memberUseCase.list(jwt.getSubject()));
    }

    @GetMapping("/{memberId}")
    public ApiResponse<MemberUseCase.View> get(
            @AuthenticationPrincipal Jwt jwt, @PathVariable String memberId) {
        return ApiResponse.ok(memberUseCase.get(jwt.getSubject(), memberId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MemberUseCase.View> register(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(
                memberUseCase.register(
                        new MemberUseCase.RegisterCommand(
                                jwt.getSubject(),
                                request.name(),
                                request.memberType(),
                                request.petType(),
                                request.birthDate(),
                                request.photoUrl(),
                                request.notes())));
    }

    /**
     * @param memberType human か pet
     * @param petType pet のときのみ指定する。整合の検証は集約が行う
     */
    public record RegisterRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank String memberType,
            String petType,
            LocalDate birthDate,
            @Size(max = 2000) String photoUrl,
            @Size(max = 2000) String notes) {}
}
