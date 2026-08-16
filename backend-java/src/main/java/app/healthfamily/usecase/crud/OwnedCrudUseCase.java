package app.healthfamily.usecase.crud;

import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;
import java.util.List;
import java.util.function.UnaryOperator;
import org.springframework.transaction.annotation.Transactional;

/**
 * 所有者を持つだけの資源に共通する読み書きの手順。
 *
 * <p>病院・アレルギー・保険・緊急連絡先など、ドメイン規則が所有権チェックしかない
 * 資源が多数ある。同じ手順を資源ごとに書き写すと、いずれ 1 箇所だけ
 * 所有権チェックを書き忘れて他人のデータが操作できるようになる。
 * 手順をここに 1 つだけ置く。
 *
 * @param resourceName 利用者向けメッセージに出す資源名（「病院」など）
 */
public class OwnedCrudUseCase<T extends OwnedResource> {

    private final OwnedCrudRepository<T> repository;
    private final String resourceName;

    public OwnedCrudUseCase(OwnedCrudRepository<T> repository, String resourceName) {
        this.repository = repository;
        this.resourceName = resourceName;
    }

    @Transactional(readOnly = true)
    public List<T> list(String userId) {
        return repository.listByUser(userId);
    }

    @Transactional(readOnly = true)
    public T get(String userId, String id) {
        return loadOwned(userId, id);
    }

    @Transactional
    public T create(String userId, T entity) {
        // 他人を所有者にした作成を防ぐ。所有者はトークンの持ち主でなければならない
        entity.requireOwnedBy(userId, resourceName);
        repository.save(entity);
        return entity;
    }

    /**
     * 既存の値をもとに更新する。
     *
     * @param mutation 現在の値を受け取り、更新後の値を返す。所有者は変更できない
     */
    @Transactional
    public T update(String userId, String id, UnaryOperator<T> mutation) {
        T current = loadOwned(userId, id);
        T updated = mutation.apply(current);
        // 更新のついでに所有者をすげ替えられないようにする
        updated.requireOwnedBy(userId, resourceName + "の所有者");
        repository.save(updated);
        return updated;
    }

    @Transactional
    public void delete(String userId, String id) {
        loadOwned(userId, id);
        repository.deleteById(id);
    }

    /** 存在確認と所有権確認をまとめて行う。読み書きの入口はすべてここを通す。 */
    private T loadOwned(String userId, String id) {
        T entity =
                repository.findById(id).orElseThrow(() -> DomainException.notFound(resourceName));
        entity.requireOwnedBy(userId, resourceName);
        return entity;
    }
}
