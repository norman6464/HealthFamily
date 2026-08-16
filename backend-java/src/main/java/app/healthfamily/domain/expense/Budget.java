package app.healthfamily.domain.expense;

import app.healthfamily.domain.shared.DomainException;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 医療費の予算とアラートの集約ルート。
 *
 * <p>「超過しているか」と「通知してよいか」は別の判断。超過していても同じ月に
 * 通知済みなら黙る。毎回通知すると利用者が通知そのものを無視するようになるため。
 */
public class Budget {

    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("yyyy-MM");

    private final String id;
    private final String userId;
    private final int monthlyAmount;
    private final boolean alertEnabled;
    private final String lastAlertedMonth;
    private final Map<String, Integer> categoryBudgets;

    private Budget(
            String id,
            String userId,
            int monthlyAmount,
            boolean alertEnabled,
            String lastAlertedMonth,
            Map<String, Integer> categoryBudgets) {
        if (userId == null || userId.isBlank()) {
            throw DomainException.validation("所有ユーザーは必須です");
        }
        if (monthlyAmount < 0) {
            throw DomainException.validation("月予算に負の値は指定できません");
        }
        Map<String, Integer> categories = categoryBudgets == null ? Map.of() : Map.copyOf(categoryBudgets);
        categories.forEach(
                (category, amount) -> {
                    if (amount == null || amount < 0) {
                        throw DomainException.validation(
                                "カテゴリ予算に負の値は指定できません: " + category);
                    }
                });
        this.id = id;
        this.userId = userId;
        this.monthlyAmount = monthlyAmount;
        this.alertEnabled = alertEnabled;
        this.lastAlertedMonth = lastAlertedMonth;
        this.categoryBudgets = categories;
    }

    public static Budget reconstitute(
            String id,
            String userId,
            int monthlyAmount,
            boolean alertEnabled,
            String lastAlertedMonth,
            Map<String, Integer> categoryBudgets) {
        return new Budget(id, userId, monthlyAmount, alertEnabled, lastAlertedMonth, categoryBudgets);
    }

    // --- 振る舞い ---------------------------------------------------------

    /**
     * その月の支出を予算と突き合わせる。
     *
     * @param month 対象月
     * @param monthTotal その月の支出合計
     * @param categoryTotals カテゴリ別の支出合計
     */
    public Status evaluate(YearMonth month, int monthTotal, Map<String, Integer> categoryTotals) {
        boolean overBudget = monthlyAmount > 0 && monthTotal > monthlyAmount;

        List<String> overCategories =
                categoryBudgets.entrySet().stream()
                        .filter(e -> e.getValue() > 0)
                        .filter(e -> categoryTotals.getOrDefault(e.getKey(), 0) > e.getValue())
                        .map(Map.Entry::getKey)
                        .sorted()
                        .toList();

        boolean exceeded = overBudget || !overCategories.isEmpty();
        boolean alreadyAlerted = month.format(MONTH).equals(lastAlertedMonth);
        boolean shouldNotify = exceeded && alertEnabled && !alreadyAlerted;

        return new Status(overBudget, overCategories, monthTotal, monthlyAmount, shouldNotify);
    }

    // --- 参照 -------------------------------------------------------------

    public String id() {
        return id;
    }

    public String userId() {
        return userId;
    }

    public int monthlyAmount() {
        return monthlyAmount;
    }

    public boolean alertEnabled() {
        return alertEnabled;
    }

    public Optional<String> lastAlertedMonth() {
        return Optional.ofNullable(lastAlertedMonth);
    }

    public Map<String, Integer> categoryBudgets() {
        return categoryBudgets;
    }

    /**
     * 突き合わせの結果。
     *
     * @param overBudget 月予算を超えているか
     * @param overCategories 予算を超えているカテゴリ
     * @param shouldNotify 通知してよいか。超過していても同じ月に通知済みなら false
     */
    public record Status(
            boolean overBudget,
            List<String> overCategories,
            int monthTotal,
            int monthlyAmount,
            boolean shouldNotify) {}
}
