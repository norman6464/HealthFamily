package app.healthfamily.apiController;

import app.healthfamily.domain.shared.DomainException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * ドメイン例外を HTTP ステータスへ対応付ける。
 *
 * <p>対応は Go 版の HandleDomainError と揃えている。
 * ドメイン層は HTTP を知らず、この 1 箇所だけが両者を橋渡しする。
 */
@RestControllerAdvice
public class DomainExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(DomainExceptionHandler.class);

    @ExceptionHandler(DomainException.NotFound.class)
    public ResponseEntity<ApiResponse<Void>> notFound(DomainException.NotFound e) {
        return respond(HttpStatus.NOT_FOUND, e);
    }

    @ExceptionHandler(DomainException.Forbidden.class)
    public ResponseEntity<ApiResponse<Void>> forbidden(DomainException.Forbidden e) {
        return respond(HttpStatus.FORBIDDEN, e);
    }

    @ExceptionHandler(DomainException.Validation.class)
    public ResponseEntity<ApiResponse<Void>> validation(DomainException.Validation e) {
        return respond(HttpStatus.BAD_REQUEST, e);
    }

    @ExceptionHandler(DomainException.Conflict.class)
    public ResponseEntity<ApiResponse<Void>> conflict(DomainException.Conflict e) {
        return respond(HttpStatus.CONFLICT, e);
    }

    /**
     * 入力値の検証エラー。
     *
     * <p>これを拾わないと catch-all に流れて 500 になり、
     * 「利用者の入力ミス」と「サーバーの不具合」が区別できなくなる。
     * どの項目が不正かだけを返し、内部の例外内容は出さない。
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> invalidRequest(MethodArgumentNotValidException e) {
        String fields =
                e.getBindingResult().getFieldErrors().stream()
                        .map(FieldError::getField)
                        .distinct()
                        .collect(Collectors.joining(", "));
        String message = fields.isBlank() ? "入力値が正しくありません" : "入力値が正しくありません: " + fields;
        return ResponseEntity.badRequest().body(ApiResponse.failure(message));
    }

    /** 本文が読めない (JSON が壊れている等)。これも利用者側の誤りなので 400。 */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> unreadableBody(HttpMessageNotReadableException e) {
        log.debug("リクエスト本文を解釈できませんでした", e);
        return ResponseEntity.badRequest().body(ApiResponse.failure("リクエストの形式が正しくありません"));
    }

    /** 想定外の例外は中身を返さない。内部構造の手がかりを与えないため。 */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> unexpected(Exception e) {
        log.error("想定外のエラー", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.failure("サーバーエラーが発生しました"));
    }

    private static ResponseEntity<ApiResponse<Void>> respond(HttpStatus status, DomainException e) {
        return ResponseEntity.status(status).body(ApiResponse.failure(e.getMessage()));
    }
}
