package app.healthfamily.domain.medication;

import app.healthfamily.domain.shared.DomainException;
import java.util.Arrays;

/** 薬の服用状態。DB に実在する値だけを列挙している。 */
public enum MedicationStatus {

    /** 服用中 */
    ACTIVE("active"),
    /** 休薬中 */
    PAUSED("paused"),
    /** 中止 */
    STOPPED("stopped");

    private final String code;

    MedicationStatus(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    /** 服用を記録してよい状態か。 */
    public boolean allowsTaking() {
        return this == ACTIVE;
    }

    public static MedicationStatus fromCode(String code) {
        return Arrays.stream(values())
                .filter(s -> s.code.equals(code))
                .findFirst()
                .orElseThrow(() -> DomainException.validation("不明な服用状態です: " + code));
    }
}
