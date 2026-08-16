package app.healthfamily.usecase.crud;

import app.healthfamily.domain.member.MemberRepository;
import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;
import java.util.List;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import org.springframework.transaction.annotation.Transactional;

/**
 * メンバーに紐づく記録の読み書き。
 *
 * <p>{@link OwnedCrudUseCase} に「対象メンバーも自分のものか」の確認を足したもの。
 *
 * <p>所有者だけを見ていると、<b>他人のメンバーに自分の記録をぶら下げられる</b>。
 * 記録自体は自分のものなので所有権チェックは通ってしまい、
 * 相手の画面に身に覚えのないアレルギーや連絡先が現れることになる。
 * メンバーの所有者まで確認して初めて防げる。
 */
public class MemberScopedCrudUseCase<T extends OwnedResource> {

    private final OwnedCrudUseCase<T> delegate;
    private final MemberRepository members;
    private final Function<T, String> memberIdOf;
    private final String resourceName;

    public MemberScopedCrudUseCase(
            OwnedCrudRepository<T> repository,
            MemberRepository members,
            Function<T, String> memberIdOf,
            String resourceName) {
        this.delegate = new OwnedCrudUseCase<>(repository, resourceName);
        this.members = members;
        this.memberIdOf = memberIdOf;
        this.resourceName = resourceName;
    }

    @Transactional(readOnly = true)
    public List<T> list(String userId) {
        return delegate.list(userId);
    }

    @Transactional(readOnly = true)
    public T get(String userId, String id) {
        return delegate.get(userId, id);
    }

    @Transactional
    public T create(String userId, T entity) {
        requireOwnedMember(userId, memberIdOf.apply(entity));
        return delegate.create(userId, entity);
    }

    @Transactional
    public T update(String userId, String id, UnaryOperator<T> mutation) {
        return delegate.update(
                userId,
                id,
                current -> {
                    T updated = mutation.apply(current);
                    // 更新で別のメンバーへ付け替える経路も塞ぐ
                    requireOwnedMember(userId, memberIdOf.apply(updated));
                    return updated;
                });
    }

    @Transactional
    public void delete(String userId, String id) {
        delegate.delete(userId, id);
    }

    private void requireOwnedMember(String userId, String memberId) {
        if (memberId == null || memberId.isBlank()) {
            throw DomainException.validation("対象メンバーは必須です");
        }
        members
                .findById(memberId)
                .orElseThrow(() -> DomainException.notFound("メンバー"))
                .requireOwnedBy(userId);
    }

    public String resourceName() {
        return resourceName;
    }
}
