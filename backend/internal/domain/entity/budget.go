package entity

import "time"

// Budget は医療費の月次予算（ユーザー単位のパーソナライズ設定）
type Budget struct {
	ID            string    `json:"id"`
	UserID        string    `json:"userId"`
	MonthlyAmount int       `json:"monthlyAmount"` // 円/月。0は未設定扱い
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}
