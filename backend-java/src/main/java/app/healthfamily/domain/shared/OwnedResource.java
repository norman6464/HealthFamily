package app.healthfamily.domain.shared;

/**
 * ユーザーに属する資源。
 *
 * <p>アレルギー・通院・病院・検査・保険など、所有者を持つだけの資源が多数ある。
 * それぞれに同じ判定を書き写すと、いずれ 1 箇所だけ書き忘れて他人のデータが
 * 見えるようになる。判定はここに 1 つだけ置く。
 */
public interface OwnedResource {

    /** この資源の所有者。 */
    String ownerId();

    /**
     * 所有者かどうか。
     *
     * <p>所有者が未設定の資源、および問い合わせ側のIDが空の場合は所有していないと扱う。
     * 「不明なら拒否」に倒すことで、null の取り違えが権限の抜け穴にならないようにしている。
     */
    default boolean ownedBy(String candidateUserId) {
        String owner = ownerId();
        return owner != null
                && !owner.isBlank()
                && candidateUserId != null
                && !candidateUserId.isBlank()
                && owner.equals(candidateUserId);
    }

    /**
     * 所有者でなければ拒否する。
     *
     * @param resourceName 利用者向けメッセージに出す資源名（「アレルギー」など）
     */
    default void requireOwnedBy(String candidateUserId, String resourceName) {
        if (!ownedBy(candidateUserId)) {
            throw DomainException.forbidden("この%sにアクセスする権限がありません".formatted(resourceName));
        }
    }
}
