package app.healthfamily.domain.memberrecord;

import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;

/**
 * 緊急連絡先。メンバーに紐づく記録。
 *
 * <p>ドメイン規則は所有権と必須項目のみ。判断が増えたらここに足す。
 */
public record EmergencyContact(
        String id,
        String userId,
        String memberId,
        String contactName,
        String phoneNumber,
        String relationship,
        String notes)
        implements OwnedResource {

    public EmergencyContact {
        if (id == null || id.isBlank()) {
            throw DomainException.validation("緊急連絡先のIDは必須です");
        }
        if (memberId == null || memberId.isBlank()) {
            throw DomainException.validation("対象メンバーは必須です");
        }
        if (contactName == null || contactName.isBlank()) {
            throw DomainException.validation("連絡先の名前は必須です");
        }
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw DomainException.validation("電話番号は必須です");
        }
    }

    @Override
    public String ownerId() {
        return userId;
    }
}
