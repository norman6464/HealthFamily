package app.healthfamily.medication.domain;

import app.healthfamily.shared.DomainException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

/**
 * 薬の集約ルート。
 *
 * <p>服薬記録（MedicationRecord）は件数が無制限に増えるため、この集約には含めない。
 * 前回服用時刻が必要な操作では、アプリケーション層が読み出して引数で渡す。
 * 集約を小さく保つための意図的な設計。
 *
 * <p>状態を変えられるのはこのクラスのメソッド経由だけで、setter は公開しない。
 */
public class Medication {

    private final String id;
    private final String userId;
    private final String memberId;
    private final String name;
    private final MedicationCategory category;
    private final MedicationStatus status;
    private final String dosageAmount;
    private final LocalDate stockAlertDate;
    private final DosingInterval interval;

    private StockQuantity stock;

    private Medication(Builder b) {
        if (b.id == null || b.id.isBlank()) {
            throw DomainException.validation("薬のIDは必須です");
        }
        if (b.userId == null || b.userId.isBlank()) {
            throw DomainException.validation("所有ユーザーは必須です");
        }
        if (b.name == null || b.name.isBlank()) {
            throw DomainException.validation("薬の名前は必須です");
        }
        this.id = b.id;
        this.userId = b.userId;
        this.memberId = b.memberId;
        this.name = b.name;
        this.category = b.category == null ? MedicationCategory.REGULAR : b.category;
        this.status = b.status == null ? MedicationStatus.ACTIVE : b.status;
        this.dosageAmount = b.dosageAmount;
        this.stockAlertDate = b.stockAlertDate;
        this.interval = b.interval;
        this.stock = b.stock;
    }

    // --- 振る舞い ---------------------------------------------------------

    /**
     * 1 回ぶん服用したことを記録する。
     *
     * <p>ここで守る不変条件は 3 つ。
     * <ol>
     *   <li>服用中（active）の薬でなければ記録できない</li>
     *   <li>間隔を強制する種別なら、前回服用から所定の時間が経っていること</li>
     *   <li>残数を管理している薬なら、残数が 1 以上あり、記録すると 1 減ること</li>
     * </ol>
     *
     * <p>Go 版ではこのいずれも実装されておらず、記録を作るだけで残数は減らなかった。
     *
     * @param now          服用時刻
     * @param lastTakenAt  前回服用時刻。初回なら空
     */
    public DoseTaken take(Instant now, Optional<Instant> lastTakenAt) {
        if (now == null) {
            throw new IllegalArgumentException("now is required");
        }
        if (!status.allowsTaking()) {
            throw DomainException.conflict(
                    status == MedicationStatus.PAUSED
                            ? "休薬中の薬は服用を記録できません"
                            : "中止した薬は服用を記録できません");
        }
        requireIntervalElapsed(now, lastTakenAt);

        Optional<StockQuantity> remaining = Optional.empty();
        if (stock != null) {
            stock = stock.consumeOne();
            remaining = Optional.of(stock);
        }
        return new DoseTaken(
                id, memberId, userId, now, Optional.ofNullable(dosageAmount), remaining);
    }

    private void requireIntervalElapsed(Instant now, Optional<Instant> lastTakenAt) {
        if (!category.enforcesInterval() || interval == null) {
            return;
        }
        Optional<Instant> last = lastTakenAt == null ? Optional.empty() : lastTakenAt;
        if (last.isEmpty()) {
            return;
        }
        if (!interval.allowsTakingAt(now, last.get())) {
            long minutes = ChronoUnit.MINUTES.between(now, interval.nextAvailableAfter(last.get()));
            throw DomainException.conflict(
                    "前回の服用から %d 時間空ける必要があります。あと %d 分お待ちください"
                            .formatted(interval.hours(), Math.max(minutes, 1)));
        }
    }

    /**
     * 次に服用できる時刻。間隔を強制しない薬、または初回なら空を返す。
     */
    public Optional<Instant> nextAvailableAt(Optional<Instant> lastTakenAt) {
        if (!category.enforcesInterval() || interval == null || lastTakenAt.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(interval.nextAvailableAfter(lastTakenAt.get()));
    }

    /**
     * 残数が少ないか。
     *
     * <p>アラート日までの残り日数より残数が少なければ「少ない」と判定する。
     * フロントの computeIsLowStock からそのまま移してきた規則で、
     * アラート日を過ぎている場合は false を返す（期限超過は別の表示で扱っているため）。
     */
    public boolean isLowStock(LocalDate today) {
        if (stock == null || stockAlertDate == null) {
            return false;
        }
        long daysUntilAlert = ChronoUnit.DAYS.between(today, stockAlertDate);
        if (daysUntilAlert <= 0) {
            return false;
        }
        return stock.isBelow(daysUntilAlert);
    }

    /** 指定ユーザーの所有物か。 */
    public boolean ownedBy(String candidateUserId) {
        return userId.equals(candidateUserId);
    }

    /** 所有者でなければ例外を投げる。 */
    public void requireOwnedBy(String candidateUserId) {
        if (!ownedBy(candidateUserId)) {
            throw DomainException.forbidden("この薬にアクセスする権限がありません");
        }
    }

    // --- 参照 -------------------------------------------------------------

    public String id() {
        return id;
    }

    public String userId() {
        return userId;
    }

    public String memberId() {
        return memberId;
    }

    public String name() {
        return name;
    }

    public MedicationCategory category() {
        return category;
    }

    public MedicationStatus status() {
        return status;
    }

    public Optional<StockQuantity> stock() {
        return Optional.ofNullable(stock);
    }

    public Optional<DosingInterval> interval() {
        return Optional.ofNullable(interval);
    }

    public Optional<LocalDate> stockAlertDate() {
        return Optional.ofNullable(stockAlertDate);
    }

    public Optional<String> dosageAmount() {
        return Optional.ofNullable(dosageAmount);
    }

    // --- 再構築 -----------------------------------------------------------

    public static Builder builder() {
        return new Builder();
    }

    /**
     * 永続化層からの再構築とテスト用の組み立てを担う。
     * ドメインの制約はコンストラクタ側でまとめて検証する。
     */
    public static final class Builder {
        private String id;
        private String userId;
        private String memberId;
        private String name;
        private MedicationCategory category;
        private MedicationStatus status;
        private String dosageAmount;
        private LocalDate stockAlertDate;
        private DosingInterval interval;
        private StockQuantity stock;

        public Builder id(String v) {
            this.id = v;
            return this;
        }

        public Builder userId(String v) {
            this.userId = v;
            return this;
        }

        public Builder memberId(String v) {
            this.memberId = v;
            return this;
        }

        public Builder name(String v) {
            this.name = v;
            return this;
        }

        public Builder category(MedicationCategory v) {
            this.category = v;
            return this;
        }

        public Builder status(MedicationStatus v) {
            this.status = v;
            return this;
        }

        public Builder dosageAmount(String v) {
            this.dosageAmount = v;
            return this;
        }

        public Builder stockAlertDate(LocalDate v) {
            this.stockAlertDate = v;
            return this;
        }

        public Builder interval(DosingInterval v) {
            this.interval = v;
            return this;
        }

        public Builder stock(StockQuantity v) {
            this.stock = v;
            return this;
        }

        public Medication build() {
            return new Medication(this);
        }
    }
}
