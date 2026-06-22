package usecase

import (
	"context"

	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// DashboardPreferenceUsecase はダッシュボードのパーソナライズ設定
type DashboardPreferenceUsecase struct {
	prefs repository.DashboardPreferenceRepository
}

func NewDashboardPreferenceUsecase(prefs repository.DashboardPreferenceRepository) *DashboardPreferenceUsecase {
	return &DashboardPreferenceUsecase{prefs: prefs}
}

// Get は設定を返す。未設定なら既定値（全カード表示・既定メンバーなし）。
func (uc *DashboardPreferenceUsecase) Get(ctx context.Context, userID string) (*entity.DashboardPreference, error) {
	p, err := uc.prefs.Get(ctx, userID)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return &entity.DashboardPreference{UserID: userID, HiddenCards: []string{}, CardOrder: []string{}}, nil
	}
	return p, nil
}

// Set は設定を保存する。
func (uc *DashboardPreferenceUsecase) Set(ctx context.Context, userID string, hiddenCards, cardOrder []string, defaultMemberID *string) (*entity.DashboardPreference, error) {
	if defaultMemberID != nil && *defaultMemberID == "" {
		defaultMemberID = nil
	}
	return uc.prefs.Upsert(ctx, userID, hiddenCards, cardOrder, defaultMemberID)
}
