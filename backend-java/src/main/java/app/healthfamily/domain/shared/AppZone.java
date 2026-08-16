package app.healthfamily.domain.shared;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * アプリケーションの基準タイムゾーン。
 *
 * <p>「今日」の境界は利用者の生活時間で決まる。服薬アラートや通院リマインダーは
 * 日付単位で判断するため、UTC のまま扱うと 9 時間ずれる。
 *
 * <p>フロントの残数判定は端末の時計とタイムゾーンに依存していた。
 * サーバー側では基準を 1 箇所に固定する。
 *
 * <p>ドメイン層に属するのでフレームワークの注釈は付けない。
 * 組み立ては config 層が行う。
 */
public class AppZone {

    private static final ZoneId TOKYO = ZoneId.of("Asia/Tokyo");

    private final Clock clock;

    public AppZone(Clock clock) {
        this.clock = clock;
    }

    public LocalDate today() {
        return LocalDate.now(clock.withZone(TOKYO));
    }

    public ZoneId zoneId() {
        return TOKYO;
    }
}
