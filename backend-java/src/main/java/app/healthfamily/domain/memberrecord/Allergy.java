package app.healthfamily.domain.memberrecord;

import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;

/**
 * アレルギー。メンバーに紐づく記録。
 *
 * <p>ドメイン規則は所有権と必須項目のみ。判断が増えたらここに足す。
 */
public record Allergy(
        String id,
        String userId,
        String memberId,
        String allergenName,
        String allergyType,
        String severity,
        String symptoms,
        String notes)
        implements OwnedResource {

    public Allergy {
        if (id == null || id.isBlank()) {
            throw DomainException.validation("アレルギーのIDは必須です");
        }
        if (memberId == null || memberId.isBlank()) {
            throw DomainException.validation("対象メンバーは必須です");
        }
        if (allergenName == null || allergenName.isBlank()) {
            throw DomainException.validation("アレルゲン名は必須です");
        }
        if (allergyType == null || allergyType.isBlank()) {
            throw DomainException.validation("アレルギーの種類は必須です");
        }
        // DB が NOT NULL のため必須。未指定なら「不明」として扱う運用もありうるが、
        // 重症度は誤って空のまま登録されると危険なので明示させる
        if (severity == null || severity.isBlank()) {
            throw DomainException.validation("重症度は必須です");
        }
    }

    @Override
    public String ownerId() {
        return userId;
    }
}
