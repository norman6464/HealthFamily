package usecase

import (
	"context"
	"testing"
	"time"

	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// 「今日」は JST で切る。
//
// 本番コンテナは distroless/static で tzdata を含まないため time.Local は UTC。
// UTC のまま日付を切ると、日本時間の 0〜9 時は前日として扱われ、
// 毎朝その時間帯だけ前日の服薬予定が表示される。

type recordingScheduleRepo struct {
	repository.ScheduleRepository
	gotDate time.Time
}

func (r *recordingScheduleRepo) GetTodaySchedules(_ context.Context, _ string, date time.Time) ([]entity.TodaySchedule, error) {
	r.gotDate = date
	return nil, nil
}

func TestToday_UTCで渡されてもJSTの日付で切る(t *testing.T) {
	cases := []struct {
		name    string
		utc     string
		wantYMD string
	}{
		{"日本時間の朝8時 (UTCでは前日23時)", "2026-08-16T23:00:00Z", "2026-08-17"},
		{"日本時間の午前0時ちょうど", "2026-08-16T15:00:00Z", "2026-08-17"},
		{"日本時間の昼", "2026-08-17T03:00:00Z", "2026-08-17"},
		{"日本時間の23時台", "2026-08-17T14:59:00Z", "2026-08-17"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			repo := &recordingScheduleRepo{}
			uc := &ScheduleUsecase{schedules: repo}
			at, _ := time.Parse(time.RFC3339, tc.utc)

			if _, err := uc.Today(context.Background(), "u-1", at); err != nil {
				t.Fatalf("%v", err)
			}

			got := repo.gotDate.Format("2006-01-02")
			if got != tc.wantYMD {
				t.Errorf("渡された日付 = %s, want %s (前日の予定が出る)", got, tc.wantYMD)
			}
			if _, offset := repo.gotDate.Zone(); offset != 9*60*60 {
				t.Errorf("JST で渡されていない: offset=%d", offset)
			}
		})
	}
}
