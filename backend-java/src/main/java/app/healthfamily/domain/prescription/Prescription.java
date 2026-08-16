package app.healthfamily.domain.prescription;

import app.healthfamily.domain.shared.DomainException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * 処方箋の集約ルート。
 *
 * <p>処方明細（{@link PrescriptionItem}）はこの集約の内側にある。件数が数点で、処方箋と
 * 生死をともにし、「明細が空でない」といった不変条件を処方箋が守る必要があるため、
 * 服薬記録とは違って集約に含めている。
 *
 * <p>明細の入れ替えも調剤も、必ずこのクラスのメソッド経由で行う。
 */
public class Prescription {

    /** 一度の調剤で作れる薬の上限。誤操作で大量生成されるのを防ぐ */
    private static final int MAX_ITEMS = 50;

    private final String id;
    private final String userId;
    private final String memberId;
    private final String prescriptionName;
    private final Instant prescribedAt;
    private final Instant expiresAt;

    private final List<PrescriptionItem> items;

    private Prescription(
            String id,
            String userId,
            String memberId,
            String prescriptionName,
            Instant prescribedAt,
            Instant expiresAt,
            List<PrescriptionItem> items) {
        if (id == null || id.isBlank()) {
            throw DomainException.validation("処方箋のIDは必須です");
        }
        if (userId == null || userId.isBlank()) {
            throw DomainException.validation("所有ユーザーは必須です");
        }
        if (prescriptionName == null || prescriptionName.isBlank()) {
            throw DomainException.validation("処方箋の名前は必須です");
        }
        this.id = id;
        this.userId = userId;
        this.memberId = memberId;
        this.prescriptionName = prescriptionName;
        this.prescribedAt = prescribedAt;
        this.expiresAt = expiresAt;
        this.items = new ArrayList<>(items == null ? List.of() : items);
    }

    public static Prescription reconstitute(
            String id,
            String userId,
            String memberId,
            String prescriptionName,
            Instant prescribedAt,
            Instant expiresAt,
            List<PrescriptionItem> items) {
        return new Prescription(
                id, userId, memberId, prescriptionName, prescribedAt, expiresAt, items);
    }

    // --- 振る舞い ---------------------------------------------------------

    /**
     * 明細をまるごと入れ替える。
     *
     * <p>明細の妥当性は処方箋の責任なので、検証はここに置く。
     *
     * @param drafts 並び順は引数の順序で決まる
     */
    public void replaceItems(List<ItemDraft> drafts, IdGenerator ids) {
        if (drafts == null || drafts.isEmpty()) {
            throw DomainException.validation("処方明細を1件以上指定してください");
        }
        if (drafts.size() > MAX_ITEMS) {
            throw DomainException.validation("処方明細は %d 件までです".formatted(MAX_ITEMS));
        }
        var replaced = new ArrayList<PrescriptionItem>(drafts.size());
        for (int i = 0; i < drafts.size(); i++) {
            ItemDraft d = drafts.get(i);
            replaced.add(
                    new PrescriptionItem(ids.newId(), d.name(), d.dosage(), d.frequency(), d.days(), i));
        }
        items.clear();
        items.addAll(replaced);
    }

    /**
     * 調剤する。明細から服薬管理に登録すべき内容を組み立てて返す。
     *
     * <p>ここでは薬を「作らない」。何を作るべきかだけを返し、実際の登録と永続化は
     * アプリケーション層が 1 トランザクションで行う。1 件ずつ登録していくと、
     * 途中で失敗したときに先に作られた薬だけが残ってしまう。
     */
    public List<DispenseOrder> dispense() {
        if (items.isEmpty()) {
            throw DomainException.validation("処方明細がありません");
        }
        return items.stream()
                .map(
                        it ->
                                new DispenseOrder(
                                        memberId,
                                        userId,
                                        it.name(),
                                        it.dosageAmount().orElse(null),
                                        it.dosingFrequency().orElse(null)))
                .toList();
    }

    /** 有効期限が切れているか。 */
    public boolean isExpired(Instant now) {
        return expiresAt != null && now.isAfter(expiresAt);
    }

    public void requireOwnedBy(String candidateUserId) {
        if (!userId.equals(candidateUserId)) {
            throw DomainException.forbidden("この処方箋にアクセスする権限がありません");
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

    public String prescriptionName() {
        return prescriptionName;
    }

    public Instant prescribedAt() {
        return prescribedAt;
    }

    public Optional<Instant> expiresAt() {
        return Optional.ofNullable(expiresAt);
    }

    /** 明細は読み取り専用で返す。外から直接 add / remove させない。 */
    public List<PrescriptionItem> items() {
        return Collections.unmodifiableList(items);
    }

    // --- 付随する型 --------------------------------------------------------

    /** 明細の入力値。IDはまだ無い。 */
    public record ItemDraft(String name, String dosage, String frequency, Integer days) {}

    /** 調剤で作るべき薬の内容。 */
    public record DispenseOrder(
            String memberId, String userId, String name, String dosage, String frequency) {}

    /** ID の採番。ドメインが UUID の実装に依存しないための差し込み口。 */
    @FunctionalInterface
    public interface IdGenerator {
        String newId();
    }
}
