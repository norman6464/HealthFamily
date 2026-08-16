package app.healthfamily.domain.member;

import app.healthfamily.domain.shared.DomainException;
import java.util.Arrays;

/**
 * ペットの動物種別。
 *
 * <p>投薬の考え方が動物ごとに違う（フィラリア薬は犬猫、ノミダニは犬猫うさぎ等）ため、
 * 自由文字列ではなく列挙で持つ。
 */
public enum PetType {
    DOG("dog"),
    CAT("cat"),
    RABBIT("rabbit"),
    BIRD("bird"),
    OTHER("other");

    private final String code;

    PetType(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    public static PetType fromCode(String code) {
        return Arrays.stream(values())
                .filter(t -> t.code.equals(code))
                .findFirst()
                .orElseThrow(() -> DomainException.validation("不明な動物種別です: " + code));
    }
}
