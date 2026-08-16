package app.healthfamily.domain.hospital;

import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;
import java.util.Optional;

/**
 * かかりつけ病院。
 *
 * <p>ドメイン規則は所有権と名前の必須のみ。判断が増えたらここに足す。
 */
public record Hospital(
        String id,
        String userId,
        String name,
        String hospitalType,
        String address,
        String phoneNumber,
        String department,
        String doctorName,
        String notes)
        implements OwnedResource {

    public Hospital {
        if (id == null || id.isBlank()) {
            throw DomainException.validation("病院のIDは必須です");
        }
        if (name == null || name.isBlank()) {
            throw DomainException.validation("病院の名前は必須です");
        }
        name = name.trim();
    }

    @Override
    public String ownerId() {
        return userId;
    }

    public Optional<String> departmentName() {
        return Optional.ofNullable(department);
    }
}
