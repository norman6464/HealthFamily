package app.healthfamily.domain.member;

import app.healthfamily.domain.shared.DomainException;
import java.util.Arrays;

/** メンバーの種別。DB に実在する値だけを列挙している。 */
public enum MemberType {
    HUMAN("human"),
    PET("pet");

    private final String code;

    MemberType(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    public boolean isPet() {
        return this == PET;
    }

    public static MemberType fromCode(String code) {
        return Arrays.stream(values())
                .filter(t -> t.code.equals(code))
                .findFirst()
                .orElseThrow(() -> DomainException.validation("不明なメンバー種別です: " + code));
    }
}
