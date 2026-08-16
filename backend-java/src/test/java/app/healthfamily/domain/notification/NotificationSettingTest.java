package app.healthfamily.domain.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.healthfamily.domain.shared.DomainException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("通知設定")
class NotificationSettingTest {

    private static NotificationSetting.Builder base() {
        return NotificationSetting.builder().id("n-1").userId("user-1");
    }

    @Nested
    @DisplayName("既定値")
    class Defaults {

        @Test
        @DisplayName("何も指定しなければ、すべての通知が有効")
        void allEnabledByDefault() {
            var setting = base().build();

            assertThat(setting.allows(NotificationKind.MEDICATION_REMINDER)).isTrue();
            assertThat(setting.allows(NotificationKind.MISSED_MEDICATION)).isTrue();
            assertThat(setting.allows(NotificationKind.APPOINTMENT_REMINDER)).isTrue();
            assertThat(setting.allows(NotificationKind.LOW_STOCK)).isTrue();
        }

        @Test
        @DisplayName("既定のリマインダーは服薬5分前・通院1日前")
        void defaultLeadTimes() {
            var setting = base().build();

            assertThat(setting.reminderMinutesBefore()).isEqualTo(5);
            assertThat(setting.appointmentReminderDaysBefore()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("種類ごとの可否")
    class PerKind {

        @Test
        @DisplayName("無効にした種類だけが止まる")
        void disablingOneKindDoesNotAffectOthers() {
            var setting = base().missedMedicationEnabled(false).build();

            assertThat(setting.allows(NotificationKind.MISSED_MEDICATION)).isFalse();
            assertThat(setting.allows(NotificationKind.MEDICATION_REMINDER)).isTrue();
        }

        @Test
        @DisplayName("メール通知を切ると、種類が有効でもメールは送らない")
        void emailOffBlocksEmailDelivery() {
            var setting = base().emailNotificationEnabled(false).build();

            assertThat(setting.allows(NotificationKind.MEDICATION_REMINDER)).isTrue();
            assertThat(setting.allowsEmail(NotificationKind.MEDICATION_REMINDER)).isFalse();
        }

        @Test
        @DisplayName("種類が無効ならメールも送らない")
        void disabledKindBlocksEmailToo() {
            var setting = base().lowStockAlertEnabled(false).build();

            assertThat(setting.allowsEmail(NotificationKind.LOW_STOCK)).isFalse();
        }

        @Test
        @DisplayName("両方有効なときだけメールを送る")
        void emailRequiresBothEnabled() {
            var setting = base().build();

            assertThat(setting.allowsEmail(NotificationKind.LOW_STOCK)).isTrue();
        }
    }

    @Nested
    @DisplayName("入力の検証")
    class Validation {

        @ParameterizedTest
        @ValueSource(ints = {-1, 1441})
        @DisplayName("服薬リマインダーの事前分数は0〜1440分の範囲")
        void reminderMinutesRange(int minutes) {
            assertThatThrownBy(() -> base().reminderMinutesBefore(minutes).build())
                    .isInstanceOf(DomainException.Validation.class);
        }

        @ParameterizedTest
        @ValueSource(ints = {-1, 366})
        @DisplayName("通院リマインダーの事前日数は0〜365日の範囲")
        void appointmentDaysRange(int days) {
            assertThatThrownBy(() -> base().appointmentReminderDaysBefore(days).build())
                    .isInstanceOf(DomainException.Validation.class);
        }

        @Test
        @DisplayName("所有ユーザーは必須")
        void ownerIsRequired() {
            assertThatThrownBy(() -> NotificationSetting.builder().id("n-2").build())
                    .isInstanceOf(DomainException.Validation.class);
        }
    }

    @Nested
    @DisplayName("所有権")
    class Ownership {

        @Test
        @DisplayName("他人の通知設定は参照できない")
        void nonOwnerIsRejected() {
            assertThatThrownBy(() -> base().build().requireOwnedBy("user-2", "通知設定"))
                    .isInstanceOf(DomainException.Forbidden.class);
        }
    }
}
