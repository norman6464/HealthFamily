package app.healthfamily.domain.memberrecord;

import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;

/**
 * 保険。メンバーに紐づく記録。
 *
 * <p>ドメイン規則は所有権と必須項目のみ。判断が増えたらここに足す。
 */
public record Insurance(
        String id,
        String userId,
        String memberId,
        String insuranceType,
        String providerName,
        String policyNumber,
        String notes)
        implements OwnedResource {

    public Insurance {
        if (id == null || id.isBlank()) {
            throw DomainException.validation("保険のIDは必須です");
        }
        if (memberId == null || memberId.isBlank()) {
            throw DomainException.validation("対象メンバーは必須です");
        }
        if (insuranceType == null || insuranceType.isBlank()) {
            throw DomainException.validation("保険の種類は必須です");
        }
    }

    @Override
    public String ownerId() {
        return userId;
    }
}
