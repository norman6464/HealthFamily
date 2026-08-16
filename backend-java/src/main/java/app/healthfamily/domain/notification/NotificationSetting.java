package app.healthfamily.domain.notification;

import app.healthfamily.domain.shared.DomainException;
import app.healthfamily.domain.shared.OwnedResource;
import java.util.EnumMap;
import java.util.Map;

/**
 * 通知設定の集約ルート。
 *
 * <p>「その種類を通知してよいか」と「メールで送ってよいか」は別の判断。
 * 種類が有効でもメール通知が切られていれば送らない。利用者が明示的に
 * 切った経路へ送ってしまうのは、通知の信頼を損なう。
 *
 * <p>既定値は DB のデフォルトと揃えてある。設定行が無い利用者にも
 * 同じ既定で通知したいため。
 */
public class NotificationSetting implements OwnedResource {

    private static final int MAX_REMINDER_MINUTES = 24 * 60;
    private static final int MAX_APPOINTMENT_DAYS = 365;

    private final String id;
    private final String userId;
    private final Map<NotificationKind, Boolean> enabledByKind;
    private final boolean emailNotificationEnabled;
    private final int reminderMinutesBefore;
    private final int appointmentReminderDaysBefore;

    private NotificationSetting(Builder b) {
        if (b.userId == null || b.userId.isBlank()) {
            throw DomainException.validation("所有ユーザーは必須です");
        }
        if (b.reminderMinutesBefore < 0 || b.reminderMinutesBefore > MAX_REMINDER_MINUTES) {
            throw DomainException.validation(
                    "服薬リマインダーの事前分数は 0〜%d 分で指定してください".formatted(MAX_REMINDER_MINUTES));
        }
        if (b.appointmentReminderDaysBefore < 0
                || b.appointmentReminderDaysBefore > MAX_APPOINTMENT_DAYS) {
            throw DomainException.validation(
                    "通院リマインダーの事前日数は 0〜%d 日で指定してください".formatted(MAX_APPOINTMENT_DAYS));
        }
        this.id = b.id;
        this.userId = b.userId;
        this.emailNotificationEnabled = b.emailNotificationEnabled;
        this.reminderMinutesBefore = b.reminderMinutesBefore;
        this.appointmentReminderDaysBefore = b.appointmentReminderDaysBefore;

        var map = new EnumMap<NotificationKind, Boolean>(NotificationKind.class);
        map.put(NotificationKind.MEDICATION_REMINDER, b.medicationReminderEnabled);
        map.put(NotificationKind.MISSED_MEDICATION, b.missedMedicationEnabled);
        map.put(NotificationKind.APPOINTMENT_REMINDER, b.appointmentReminderEnabled);
        map.put(NotificationKind.LOW_STOCK, b.lowStockAlertEnabled);
        this.enabledByKind = map;
    }

    // --- 振る舞い ---------------------------------------------------------

    /** その種類の通知を出してよいか。 */
    public boolean allows(NotificationKind kind) {
        return Boolean.TRUE.equals(enabledByKind.get(kind));
    }

    /**
     * その種類をメールで送ってよいか。
     *
     * <p>種類とメール経路の両方が有効なときだけ true。
     */
    public boolean allowsEmail(NotificationKind kind) {
        return allows(kind) && emailNotificationEnabled;
    }

    @Override
    public String ownerId() {
        return userId;
    }

    // --- 参照 -------------------------------------------------------------

    public String id() {
        return id;
    }

    public String userId() {
        return userId;
    }

    public boolean emailNotificationEnabled() {
        return emailNotificationEnabled;
    }

    public int reminderMinutesBefore() {
        return reminderMinutesBefore;
    }

    public int appointmentReminderDaysBefore() {
        return appointmentReminderDaysBefore;
    }

    // --- 組み立て ---------------------------------------------------------

    public static Builder builder() {
        return new Builder();
    }

    /** 既定値は DB のデフォルトと揃えている。 */
    public static final class Builder {
        private String id;
        private String userId;
        private boolean medicationReminderEnabled = true;
        private boolean missedMedicationEnabled = true;
        private boolean appointmentReminderEnabled = true;
        private boolean lowStockAlertEnabled = true;
        private boolean emailNotificationEnabled = true;
        private int reminderMinutesBefore = 5;
        private int appointmentReminderDaysBefore = 1;

        public Builder id(String v) {
            this.id = v;
            return this;
        }

        public Builder userId(String v) {
            this.userId = v;
            return this;
        }

        public Builder medicationReminderEnabled(boolean v) {
            this.medicationReminderEnabled = v;
            return this;
        }

        public Builder missedMedicationEnabled(boolean v) {
            this.missedMedicationEnabled = v;
            return this;
        }

        public Builder appointmentReminderEnabled(boolean v) {
            this.appointmentReminderEnabled = v;
            return this;
        }

        public Builder lowStockAlertEnabled(boolean v) {
            this.lowStockAlertEnabled = v;
            return this;
        }

        public Builder emailNotificationEnabled(boolean v) {
            this.emailNotificationEnabled = v;
            return this;
        }

        public Builder reminderMinutesBefore(int v) {
            this.reminderMinutesBefore = v;
            return this;
        }

        public Builder appointmentReminderDaysBefore(int v) {
            this.appointmentReminderDaysBefore = v;
            return this;
        }

        public NotificationSetting build() {
            return new NotificationSetting(this);
        }
    }
}
