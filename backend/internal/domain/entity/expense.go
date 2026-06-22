package entity

import "time"

// Expense は医療費・健康支出の1件
type Expense struct {
	ID           string    `json:"id"`
	UserID       string    `json:"userId"`
	MemberID     *string   `json:"memberId"`
	Category     string    `json:"category"`
	Amount       int       `json:"amount"` // 円(整数)
	Description  *string   `json:"description"`
	ExpenseDate  time.Time `json:"expenseDate"`
	IsDeductible bool      `json:"isDeductible"` // 医療費控除の対象か
	CreatedAt    time.Time `json:"createdAt"`
}

// MonthlyTotal は月別合計
type MonthlyTotal struct {
	Month int `json:"month"` // 1-12
	Total int `json:"total"`
}

// ExpenseSummary は年間の集計（医療費控除の試算に使う読み取りモデル）
type ExpenseSummary struct {
	Year            int            `json:"year"`
	Total           int            `json:"total"`
	DeductibleTotal int            `json:"deductibleTotal"`
	ByCategory      map[string]int `json:"byCategory"`
	ByMonth         []MonthlyTotal `json:"byMonth"`
	// 2制度シミュレーション（簡易。所得の5%ルールは所得不明のため10万円固定で概算）
	RegularDeduction        int    `json:"regularDeduction"`        // 通常医療費控除の控除対象額(10万円超過分)
	SelfMedicationDeduction int    `json:"selfMedicationDeduction"` // セルフメディケーション税制の控除対象額
	RecommendedScheme       string `json:"recommendedScheme"`       // "regular" | "selfmed" | "none"
}
