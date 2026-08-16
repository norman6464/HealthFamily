package app.healthfamily.domain.member;

import app.healthfamily.domain.shared.DomainException;
import java.time.LocalDate;
import java.time.Period;
import java.util.Optional;

/**
 * 家族メンバー（人・ペット）の集約ルート。
 *
 * <p>薬・通院・体調記録などはすべてメンバーに紐づく。所有権の起点になるため、
 * 「誰のメンバーか」の判定はここに集約する。
 *
 * <p>種別と動物種別の整合（人なのに犬、ペットなのに種別なし）は、
 * 組み立て時に必ず検証する。DB は両方 nullable な text なので、
 * 型で防げない分をここで潰す。
 */
public class Member {

    private final String id;
    private final String userId;
    private final String name;
    private final MemberType type;
    private final PetType petType;
    private final LocalDate birthDate;
    private final String photoUrl;
    private final String notes;

    private Member(Builder b, LocalDate today) {
        if (b.id == null || b.id.isBlank()) {
            throw DomainException.validation("メンバーIDは必須です");
        }
        if (b.userId == null || b.userId.isBlank()) {
            throw DomainException.validation("所有ユーザーは必須です");
        }
        if (b.name == null || b.name.isBlank()) {
            throw DomainException.validation("名前は必須です");
        }
        MemberType type = b.type == null ? MemberType.HUMAN : b.type;
        if (type.isPet() && b.petType == null) {
            throw DomainException.validation("ペットの動物種別は必須です");
        }
        if (!type.isPet() && b.petType != null) {
            throw DomainException.validation("人に動物種別は設定できません");
        }
        if (b.birthDate != null && today != null && b.birthDate.isAfter(today)) {
            throw DomainException.validation("生年月日に未来の日付は指定できません");
        }
        this.id = b.id;
        this.userId = b.userId;
        this.name = b.name.trim();
        this.type = type;
        this.petType = b.petType;
        this.birthDate = b.birthDate;
        this.photoUrl = b.photoUrl;
        this.notes = b.notes;
    }

    // --- 振る舞い ---------------------------------------------------------

    /** 満年齢。生年月日が無ければ空。 */
    public Optional<Integer> ageAt(LocalDate today) {
        return Optional.ofNullable(birthDate).map(b -> Period.between(b, today).getYears());
    }

    public boolean ownedBy(String candidateUserId) {
        return userId.equals(candidateUserId);
    }

    public void requireOwnedBy(String candidateUserId) {
        if (!ownedBy(candidateUserId)) {
            throw DomainException.forbidden("このメンバーにアクセスする権限がありません");
        }
    }

    // --- 参照 -------------------------------------------------------------

    public String id() {
        return id;
    }

    public String userId() {
        return userId;
    }

    public String name() {
        return name;
    }

    public MemberType type() {
        return type;
    }

    public Optional<PetType> petType() {
        return Optional.ofNullable(petType);
    }

    public Optional<LocalDate> birthDate() {
        return Optional.ofNullable(birthDate);
    }

    public Optional<String> photoUrl() {
        return Optional.ofNullable(photoUrl);
    }

    public Optional<String> notes() {
        return Optional.ofNullable(notes);
    }

    // --- 組み立て ---------------------------------------------------------

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private String id;
        private String userId;
        private String name;
        private MemberType type;
        private PetType petType;
        private LocalDate birthDate;
        private String photoUrl;
        private String notes;

        public Builder id(String v) {
            this.id = v;
            return this;
        }

        public Builder userId(String v) {
            this.userId = v;
            return this;
        }

        public Builder name(String v) {
            this.name = v;
            return this;
        }

        public Builder type(MemberType v) {
            this.type = v;
            return this;
        }

        public Builder petType(PetType v) {
            this.petType = v;
            return this;
        }

        public Builder birthDate(LocalDate v) {
            this.birthDate = v;
            return this;
        }

        public Builder photoUrl(String v) {
            this.photoUrl = v;
            return this;
        }

        public Builder notes(String v) {
            this.notes = v;
            return this;
        }

        /** 生年月日の未来チェックを行わずに組み立てる。永続化層からの再構築用。 */
        public Member build() {
            return new Member(this, null);
        }

        /** 「今日」を渡して組み立てる。新規登録・更新はこちらを使う。 */
        public Member build(LocalDate today) {
            return new Member(this, today);
        }
    }
}
