package app.healthfamily.domain.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.shared.DomainException;
import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("Member 集約")
class MemberTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 8, 16);

    private static Member.Builder human() {
        return Member.builder().id("m-1").userId("user-1").name("本人").type(MemberType.HUMAN);
    }

    private static Member.Builder pet() {
        return Member.builder()
                .id("m-2")
                .userId("user-1")
                .name("ポチ")
                .type(MemberType.PET)
                .petType(PetType.DOG);
    }

    @Nested
    @DisplayName("組み立て時の検証")
    class Construction {

        @Test
        @DisplayName("人は petType を持たない")
        void humanHasNoPetType() {
            assertThat(human().build().petType()).isEmpty();
        }

        @Test
        @DisplayName("人に petType を付けると拒否する")
        void humanWithPetTypeIsRejected() {
            assertThatThrownBy(() -> human().petType(PetType.DOG).build())
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("人に動物種別");
        }

        @Test
        @DisplayName("ペットは動物種別が必須")
        void petRequiresPetType() {
            assertThatThrownBy(
                            () ->
                                    Member.builder()
                                            .id("m-3")
                                            .userId("user-1")
                                            .name("名無し")
                                            .type(MemberType.PET)
                                            .build())
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("動物種別は必須");
        }

        @Test
        @DisplayName("名前は必須")
        void nameIsRequired() {
            assertThatThrownBy(() -> human().name(" ").build())
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("名前は必須");
        }

        @Test
        @DisplayName("未来の生年月日は受け付けない")
        void futureBirthDateIsRejected() {
            assertThatThrownBy(() -> human().birthDate(TODAY.plusDays(1)).build(TODAY))
                    .isInstanceOf(DomainException.Validation.class)
                    .hasMessageContaining("未来");
        }

        @Test
        @DisplayName("今日生まれは受け付ける")
        void todayBirthDateIsAllowed() {
            assertThatCode(() -> human().birthDate(TODAY).build(TODAY)).doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("年齢")
    class Age {

        @Test
        @DisplayName("誕生日を迎えていれば満年齢が上がる")
        void afterBirthday() {
            var member = human().birthDate(LocalDate.of(2000, 8, 16)).build(TODAY);

            assertThat(member.ageAt(TODAY)).contains(26);
        }

        @Test
        @DisplayName("誕生日の前日はまだ上がらない")
        void beforeBirthday() {
            var member = human().birthDate(LocalDate.of(2000, 8, 17)).build(TODAY);

            assertThat(member.ageAt(TODAY)).contains(25);
        }

        @Test
        @DisplayName("生年月日が無ければ算出しない")
        void withoutBirthDate() {
            assertThat(human().build().ageAt(TODAY)).isEmpty();
        }
    }

    @Nested
    @DisplayName("所有権")
    class Ownership {

        @Test
        @DisplayName("所有者でなければ拒否する")
        void nonOwnerIsRejected() {
            assertThatThrownBy(() -> pet().build().requireOwnedBy("user-2"))
                    .isInstanceOf(DomainException.Forbidden.class)
                    .hasMessageContaining("権限がありません");
        }

        @Test
        @DisplayName("所有者なら通る")
        void ownerPasses() {
            pet().build().requireOwnedBy("user-1");
        }
    }

    @Nested
    @DisplayName("種別コード")
    class Codes {

        @Test
        @DisplayName("DB にある種別をすべて解釈できる")
        void storedCodesParse() {
            assertThat(MemberType.fromCode("human")).isEqualTo(MemberType.HUMAN);
            assertThat(MemberType.fromCode("pet")).isEqualTo(MemberType.PET);
            assertThat(PetType.fromCode("dog")).isEqualTo(PetType.DOG);
        }

        @Test
        @DisplayName("未知のコードは弾く")
        void unknownCodeIsRejected() {
            assertThatThrownBy(() -> MemberType.fromCode("alien"))
                    .isInstanceOf(DomainException.Validation.class);
        }
    }
}
