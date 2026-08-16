package app.healthfamily.infrastructure.medication;

import static app.healthfamily.infrastructure.jooq.Tables.MEDICATION;

import app.healthfamily.domain.medication.DosingInterval;
import app.healthfamily.domain.medication.Medication;
import app.healthfamily.domain.medication.MedicationCategory;
import app.healthfamily.domain.medication.MedicationRepository;
import app.healthfamily.domain.medication.MedicationStatus;
import app.healthfamily.domain.medication.StockQuantity;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

/**
 * Medication 集約の永続化（jOOQ）。
 *
 * <p>列名は生成されたメタデータから参照するので、スキーマを変えて再生成すれば
 * 食い違いはコンパイルエラーとして出る。文字列 SQL のときのような
 * 「実行するまで気づけない綴り違い」が起きない。
 */
@Repository
public class JooqMedicationRepository implements MedicationRepository {

    private final DSLContext dsl;

    public JooqMedicationRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public Optional<Medication> findById(String medicationId) {
        return dsl.select()
                .from(MEDICATION)
                .where(MEDICATION.ID.eq(medicationId))
                .fetchOptional()
                .map(JooqMedicationRepository::toAggregate);
    }

    @Override
    public List<Medication> listByUser(String userId) {
        return dsl.select()
                .from(MEDICATION)
                .where(MEDICATION.USERID.eq(userId))
                .orderBy(MEDICATION.DISPLAYORDER.asc(), MEDICATION.CREATEDAT.asc())
                .fetch()
                .map(JooqMedicationRepository::toAggregate);
    }

    @Override
    public void save(Medication medication) {
        dsl.update(MEDICATION)
                .set(MEDICATION.STOCKQUANTITY, medication.stock().map(StockQuantity::value).orElse(null))
                .set(MEDICATION.UPDATEDAT, OffsetDateTime.now(ZoneOffset.UTC))
                .where(MEDICATION.ID.eq(medication.id()))
                .execute();
    }

    /**
     * 行から集約を再構築する。
     *
     * <p>{@code stockAlertDate} は timestamptz だが、実データは UTC の 0 時ちょうどで
     * 「日付」として書かれている。書かれ方に合わせて UTC で日付へ落とす。
     */
    private static Medication toAggregate(Record row) {
        var builder =
                Medication.builder()
                        .id(row.get(MEDICATION.ID))
                        .userId(row.get(MEDICATION.USERID))
                        .memberId(row.get(MEDICATION.MEMBERID))
                        .name(row.get(MEDICATION.NAME))
                        .category(MedicationCategory.fromCode(row.get(MEDICATION.CATEGORY)))
                        .status(MedicationStatus.fromCode(row.get(MEDICATION.STATUS)))
                        .dosageAmount(row.get(MEDICATION.DOSAGEAMOUNT));

        Integer stock = row.get(MEDICATION.STOCKQUANTITY);
        if (stock != null) {
            builder.stock(StockQuantity.of(stock));
        }
        Integer intervalHours = row.get(MEDICATION.INTERVALHOURS);
        if (intervalHours != null) {
            builder.interval(DosingInterval.ofHours(intervalHours));
        }
        OffsetDateTime alertAt = row.get(MEDICATION.STOCKALERTDATE);
        if (alertAt != null) {
            builder.stockAlertDate(alertAt.atZoneSameInstant(ZoneOffset.UTC).toLocalDate());
        }
        return builder.build();
    }
}
