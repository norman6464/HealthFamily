package entity

import "time"

// CategoryBudget はカテゴリ別の月次予算
type CategoryBudget struct {
	Category      string `json:"category"`
	MonthlyAmount int    `json:"monthlyAmount"`
}

// Budget は医療費の月次予算（ユーザー単位のパーソナライズ設定）
type Budget struct {
	ID               string           `json:"id"`
	UserID           string           `json:"userId"`
	MonthlyAmount    int              `json:"monthlyAmount"` // 円/月。0は未設定扱い
	AlertEnabled     bool             `json:"alertEnabled"`  // 予算超過アラートを有効にするか
	LastAlertedMonth *string          `json:"lastAlertedMonth"`
	Categories       []CategoryBudget `json:"categories"`
	CreatedAt        time.Time        `json:"createdAt"`
	UpdatedAt        time.Time        `json:"updatedAt"`
}

// BudgetAlertStatus は当月の予算超過判定結果
type BudgetAlertStatus struct {
	OverBudget     bool     `json:"overBudget"`
	MonthTotal     int      `json:"monthTotal"`
	MonthlyAmount  int      `json:"monthlyAmount"`
	OverCategories []string `json:"overCategories"`
	EmailSent      bool     `json:"emailSent"`
}

// DashboardPreference はダッシュボードのパーソナライズ設定（ユーザー単位）
type DashboardPreference struct {
	UserID          string   `json:"userId"`
	HiddenCards     []string `json:"hiddenCards"`
	CardOrder       []string `json:"cardOrder"`
	DefaultMemberID *string  `json:"defaultMemberId"`
}
