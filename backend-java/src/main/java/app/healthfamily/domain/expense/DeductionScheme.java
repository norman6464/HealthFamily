package app.healthfamily.domain.expense;

/**
 * 医療費控除の制度。
 *
 * <p>通常の医療費控除とセルフメディケーション税制は<b>併用できない</b>ため、
 * どちらか一方を選ぶことになる。
 */
public enum DeductionScheme {
    /** 控除を受けられる見込みが無い */
    NONE("none"),
    /** 通常の医療費控除 */
    REGULAR("regular"),
    /** セルフメディケーション税制 */
    SELF_MEDICATION("selfmed");

    private final String code;

    DeductionScheme(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }
}
