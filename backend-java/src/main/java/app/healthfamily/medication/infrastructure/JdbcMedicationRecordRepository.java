package app.healthfamily.medication.infrastructure;

import app.healthfamily.medication.domain.MedicationRecord;
import app.healthfamily.medication.domain.MedicationRecordRepository;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** 服薬記録の JDBC 実装。 */
@Repository
public class JdbcMedicationRecordRepository implements MedicationRecordRepository {

    private static final String SELECT_LAST_TAKEN_AT =
            """
            SELECT "takenAt"
              FROM "MedicationRecord"
             WHERE "medicationId" = :medicationId
             ORDER BY "takenAt" DESC
             LIMIT 1
            """;

    private static final String INSERT =
            """
            INSERT INTO "MedicationRecord"
                   (id, "medicationId", "memberId", "userId", "scheduleId",
                    "takenAt", "dosageAmount", notes)
            VALUES (:id, :medicationId, :memberId, :userId, :scheduleId,
                    :takenAt, :dosageAmount, :notes)
            """;

    private final JdbcClient jdbc;

    public JdbcMedicationRecordRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Instant> findLastTakenAt(String medicationId) {
        return jdbc.sql(SELECT_LAST_TAKEN_AT)
                .param("medicationId", medicationId)
                .query(OffsetDateTime.class)
                .optional()
                .map(OffsetDateTime::toInstant);
    }

    @Override
    public void append(MedicationRecord record) {
        jdbc.sql(INSERT)
                .param("id", record.id())
                .param("medicationId", record.medicationId())
                .param("memberId", record.memberId())
                .param("userId", record.userId())
                .param("scheduleId", record.scheduleId())
                .param("takenAt", OffsetDateTime.ofInstant(record.takenAt(), java.time.ZoneOffset.UTC))
                .param("dosageAmount", record.dosageAmount())
                .param("notes", record.notes())
                .update();
    }
}
