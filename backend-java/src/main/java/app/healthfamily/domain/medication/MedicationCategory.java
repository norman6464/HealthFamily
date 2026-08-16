package app.healthfamily.domain.medication;

import app.healthfamily.domain.shared.DomainException;
import java.util.Arrays;

/**
 * 薬の種別。DB に実在する値だけを列挙している。
 *
 * <p>{@link #PRN} は頓服（pro re nata）。服用間隔の制約が効くのはこの種別だけで、
 * 定時薬はスケジュールに従うため間隔判定の対象外とする。
 */
public enum MedicationCategory {

    /** 定時薬 */
    REGULAR("regular", false),
    /** 頓服薬 */
    PRN("prn", true),
    /** 吸入薬 */
    INHALER("inhaler", true),
    /** 点眼薬 */
    EYE_DROPS("eye_drops", true),
    /** サプリメント */
    SUPPLEMENT("supplement", false);

    private final String code;
    private final boolean intervalEnforced;

    MedicationCategory(String code, boolean intervalEnforced) {
        this.code = code;
        this.intervalEnforced = intervalEnforced;
    }

    public String code() {
        return code;
    }

    /** この種別で服用間隔を強制するか。 */
    public boolean enforcesInterval() {
        return intervalEnforced;
    }

    public static MedicationCategory fromCode(String code) {
        return Arrays.stream(values())
                .filter(c -> c.code.equals(code))
                .findFirst()
                .orElseThrow(() -> DomainException.validation("不明な薬の種別です: " + code));
    }
}
