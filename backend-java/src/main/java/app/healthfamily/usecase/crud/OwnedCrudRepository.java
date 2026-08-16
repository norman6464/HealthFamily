package app.healthfamily.usecase.crud;

import app.healthfamily.domain.shared.OwnedResource;
import java.util.List;
import java.util.Optional;

/**
 * 所有者を持つだけの資源の永続化ポート。
 *
 * <p>絞り込みの責任はユースケース側にある。{@link #findById} は所有者を見ないので、
 * これを直接呼ぶ実装を書くと権限チェックが抜ける。必ず
 * {@link OwnedCrudUseCase} を通すこと。
 */
public interface OwnedCrudRepository<T extends OwnedResource> {

    Optional<T> findById(String id);

    List<T> listByUser(String userId);

    void save(T entity);

    void deleteById(String id);
}
