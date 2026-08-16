package app.healthfamily.domain.expense;

import app.healthfamily.domain.shared.DomainException;

/**
 * 医療費控除の試算結果。
 *
 * <p>2 つの制度は併用できないので、両方の控除額を出したうえで有利なほうを示す。
 *
 * <p>あくまで概算であり、申告額を保証するものではない。通常の医療費控除の足切りは
 * 本来「10万円か所得の5%の低いほう」だが、所得を扱っていないため 10万円で固定している。
 *
 * @param regularDeduction 通常の医療費控除の対象額
 * @param selfMedicationDeduction セルフメディケーション税制の対象額
 * @param recommended 有利なほうの制度
 */
public record MedicalDeduction(
        int regularDeduction, int selfMedicationDeduction, DeductionScheme recommended) {

    /** 通常の医療費控除の足切り */
    private static final int REGULAR_THRESHOLD = 100_000;

    /** セルフメディケーション税制の足切り */
    private static final int SELF_MEDICATION_FLOOR = 12_000;

    /** セルフメディケーション税制の上限 */
    private static final int SELF_MEDICATION_CAP = 88_000;

    /**
     * @param deductibleTotal 控除対象として記録された医療費の合計
     * @param pharmacyTotal 薬局(OTC)での購入額。セルフメディケーション税制の概算に使う
     */
    public static MedicalDeduction simulate(int deductibleTotal, int pharmacyTotal) {
        if (deductibleTotal < 0 || pharmacyTotal < 0) {
            throw DomainException.validation("金額に負の値は指定できません");
        }
        int regular = Math.max(0, deductibleTotal - REGULAR_THRESHOLD);
        int selfMedication =
                Math.min(SELF_MEDICATION_CAP, Math.max(0, pharmacyTotal - SELF_MEDICATION_FLOOR));

        DeductionScheme recommended;
        if (regular == 0 && selfMedication == 0) {
            recommended = DeductionScheme.NONE;
        } else if (regular >= selfMedication) {
            recommended = DeductionScheme.REGULAR;
        } else {
            recommended = DeductionScheme.SELF_MEDICATION;
        }
        return new MedicalDeduction(regular, selfMedication, recommended);
    }
}
