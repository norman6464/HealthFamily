package app.healthfamily.apiController;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * API のレスポンス形式。
 *
 * <p>{@code { success, data?, error? }} は Next.js 版から続く形で、
 * Go 版・フロントともにこれを前提にしている。移行中も変えない。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(boolean success, T data, String error) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> failure(String message) {
        return new ApiResponse<>(false, null, message);
    }
}
