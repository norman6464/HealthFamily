package app.healthfamily.medication.infrastructure;

import app.healthfamily.medication.domain.DosingInterval;
import app.healthfamily.medication.domain.Medication;
import app.healthfamily.medication.domain.MedicationCategory;
import app.healthfamily.medication.domain.MedicationRepository;
import app.healthfamily.medication.domain.MedicationStatus;
import app.healthfamily.medication.domain.StockQuantity;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Medication 集約の JDBC 実装。
 *
 * <p>テーブルは Go 版と共有しているため、列名は Prisma 由来のキャメルケースのまま。
 * 引用符が必須な点に注意。
 */
@Repository
public class JdbcMedicationRepository implements MedicationRepository {

    private static final String SELECT_BY_ID =
            """
            SELECT id, "memberId", "userId", name, category, "dosageAmount",
                   "stockQuantity", "stockAlertDate", "intervalHours", status
              FROM "Medication"
             WHERE id = :id
            """;

    private static final String UPDATE_STOCK =
            """
            UPDATE "Medication"
               SET "stockQuantity" = :stock,
                   "updatedAt"     = now()
             WHERE id = :id
            """;

    private final JdbcClient jdbc;

    public JdbcMedicationRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Medication> findById(String medicationId) {
        return jdbc.sql(SELECT_BY_ID)
                .param("id", medicationId)
                .query(JdbcMedicationRepository::toAggregate)
                .optional();
    }

    @Override
    public void save(Medication medication) {
        jdbc.sql(UPDATE_STOCK)
                .param("stock", medication.stock().map(StockQuantity::value).orElse(null))
                .param("id", medication.id())
                .update();
    }

    /**
     * 行から集約を再構築する。
     *
     * <p>{@code stockAlertDate} は timestamptz だが、実データは UTC の 0 時ちょうどで
     * 「日付」として書かれている。書かれ方に合わせて UTC で日付へ落とす。
     */
    private static Medication toAggregate(ResultSet rs, int rowNum) throws SQLException {
        var builder =
                Medication.builder()
                        .id(rs.getString("id"))
                        .userId(rs.getString("userId"))
                        .memberId(rs.getString("memberId"))
                        .name(rs.getString("name"))
                        .category(MedicationCategory.fromCode(rs.getString("category")))
                        .status(MedicationStatus.fromCode(rs.getString("status")))
                        .dosageAmount(rs.getString("dosageAmount"));

        int stock = rs.getInt("stockQuantity");
        if (!rs.wasNull()) {
            builder.stock(StockQuantity.of(stock));
        }

        int intervalHours = rs.getInt("intervalHours");
        if (!rs.wasNull()) {
            builder.interval(DosingInterval.ofHours(intervalHours));
        }

        OffsetDateTime alertAt = rs.getObject("stockAlertDate", OffsetDateTime.class);
        if (alertAt != null) {
            builder.stockAlertDate(alertAt.atZoneSameInstant(ZoneOffset.UTC).toLocalDate());
        }

        return builder.build();
    }
}
