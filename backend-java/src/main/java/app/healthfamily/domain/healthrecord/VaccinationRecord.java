package app.healthfamily.domain.healthrecord;

import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;
import java.time.LocalDate;

/** ワクチン接種の記録。次回接種の判定は {@link VaccinationSchedule} が持つ。 */
public record VaccinationRecord(
        String id,
        String userId,
        String memberId,
        String vaccineName,
        VaccinationSchedule schedule,
        String notes)
        implements OwnedResource {

    public VaccinationRecord {
        if (id == null || id.isBlank()) {
            throw DomainException.validation("記録のIDは必須です");
        }
        if (memberId == null || memberId.isBlank()) {
            throw DomainException.validation("対象メンバーは必須です");
        }
        if (vaccineName == null || vaccineName.isBlank()) {
            throw DomainException.validation("ワクチン名は必須です");
        }
        if (schedule == null || schedule.vaccinatedAt() == null) {
            throw DomainException.validation("接種日は必須です");
        }
    }

    @Override
    public String ownerId() {
        return userId;
    }

    public boolean needsReminderOn(LocalDate today) {
        return schedule.needsReminderOn(today);
    }
}
