package app.healthfamily.medication.domain;

import app.healthfamily.shared.DomainException;
import java.time.Duration;
import java.time.Instant;

/**
 * 頓服薬の最短服用間隔。
 *
 * <p>「前回から 4 時間空けること」という医療上の制約を表す。
 * Go 版では {@code IntervalHours *int} が保存されているだけで、
 * この制約を強制するコードはどこにも存在しなかった。
 */
public record DosingInterval(int hours) {

    public DosingInterval {
        if (hours <= 0) {
            throw DomainException.validation("服用間隔は 1 時間以上で指定してください");
        }
        if (hours > 24 * 7) {
            throw DomainException.validation("服用間隔は 168 時間（7日）以内で指定してください");
        }
    }

    public static DosingInterval ofHours(int hours) {
        return new DosingInterval(hours);
    }

    public Duration duration() {
        return Duration.ofHours(hours);
    }

    /** 前回服用時刻から、次に服用できる時刻を求める。 */
    public Instant nextAvailableAfter(Instant lastTakenAt) {
        return lastTakenAt.plus(duration());
    }

    /** その時刻に服用してよいか。境界（ちょうど間隔ぶん経過）は服用可とする。 */
    public boolean allowsTakingAt(Instant now, Instant lastTakenAt) {
        return !now.isBefore(nextAvailableAfter(lastTakenAt));
    }
}
