package app.healthfamily.domain.prescription;

import app.healthfamily.domain.shared.DomainException;
import java.util.Optional;

/**
 * 処方明細。処方箋に従属する子エンティティで、単独では存在しない。
 *
 * <p>生成と入れ替えは必ず {@link Prescription} 経由で行う。処方箋を通さずに明細だけを
 * 差し替えると「明細が空でない」といった不変条件を守れなくなるため、集約が
 * {@link Prescription#items()} を読み取り専用でしか返さないことで担保している。
 *
 * @param days 処方日数。未指定なら null
 */
public record PrescriptionItem(
        String id, String name, String dosage, String frequency, Integer days, int sortOrder) {

    public PrescriptionItem {
        if (name == null || name.isBlank()) {
            throw DomainException.validation("薬の名前は必須です");
        }
        if (days != null && days <= 0) {
            throw DomainException.validation("処方日数は 1 日以上で指定してください");
        }
        if (sortOrder < 0) {
            throw DomainException.validation("並び順に負の値は指定できません");
        }
        name = name.trim();
    }

    public Optional<String> dosageAmount() {
        return Optional.ofNullable(dosage).filter(d -> !d.isBlank());
    }

    public Optional<String> dosingFrequency() {
        return Optional.ofNullable(frequency).filter(f -> !f.isBlank());
    }

    public Optional<Integer> prescribedDays() {
        return Optional.ofNullable(days);
    }
}
