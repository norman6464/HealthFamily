package app.healthfamily.domain.healthrecord;

/**
 * 発熱の段階。
 *
 * <p>診断ではなく、記録を見返すときの目印として使う。
 * 受診の要否を判断するものではない。
 */
public enum FeverLevel {
    /** 36.0 度未満 */
    LOW,
    /** 36.0 度以上 37.5 度未満 */
    NORMAL,
    /** 37.5 度以上 38.0 度未満 */
    SLIGHT_FEVER,
    /** 38.0 度以上 */
    FEVER
}
