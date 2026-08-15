package app.healthfamily.medication.domain;

import app.healthfamily.shared.DomainException;

/**
 * 薬の残数。
 *
 * <p>「負の残数」という状態をコンストラクタで潰しているので、この型を持ち回る限り
 * 残数が負になることはない。Go 版では {@code *int} をそのまま扱っていたため、
 * 負値を弾く責任がどこにもなかった。
 */
public record StockQuantity(int value) {

    public StockQuantity {
        if (value < 0) {
            throw DomainException.validation("残数に負の値は指定できません");
        }
    }

    public static StockQuantity of(int value) {
        return new StockQuantity(value);
    }

    public boolean isEmpty() {
        return value == 0;
    }

    /** 1 回ぶん減らす。残数が 0 のときは不変条件違反として拒否する。 */
    public StockQuantity consumeOne() {
        if (isEmpty()) {
            throw DomainException.conflict("残数が 0 のため服用を記録できません");
        }
        return new StockQuantity(value - 1);
    }

    /** 指定した日数ぶんを下回っているか。残数アラートの判定に使う。 */
    public boolean isBelow(long days) {
        return value < days;
    }
}
