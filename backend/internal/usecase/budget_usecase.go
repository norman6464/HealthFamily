package usecase

import (
	"context"
	"fmt"
	"time"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/pkg/mailer"
)

var jst = time.FixedZone("Asia/Tokyo", 9*60*60)

// BudgetUsecase は月次予算（パーソナライズ）と予算超過アラートのビジネスロジック
type BudgetUsecase struct {
	budgets  repository.BudgetRepository
	expenses repository.ExpenseRepository
	users    repository.UserRepository
	mail     mailer.Mailer
	now      func() time.Time
}

func NewBudgetUsecase(budgets repository.BudgetRepository, expenses repository.ExpenseRepository, users repository.UserRepository, mail mailer.Mailer) *BudgetUsecase {
	return &BudgetUsecase{budgets: budgets, expenses: expenses, users: users, mail: mail, now: time.Now}
}

// Get は予算を返す。未設定なら既定値(0円・アラート有効)を返す。
func (uc *BudgetUsecase) Get(ctx context.Context, userID string) (*entity.Budget, error) {
	b, err := uc.budgets.Get(ctx, userID)
	if err != nil {
		return nil, err
	}
	if b == nil {
		return &entity.Budget{UserID: userID, MonthlyAmount: 0, AlertEnabled: true, Categories: []entity.CategoryBudget{}}, nil
	}
	return b, nil
}

// Set は予算（総額・カテゴリ別・アラート設定）を保存する。負の金額は保存させない。
func (uc *BudgetUsecase) Set(ctx context.Context, userID string, in repository.SetBudgetInput) (*entity.Budget, error) {
	if in.MonthlyAmount < 0 {
		return nil, domain.NewValidation("予算は0円以上で入力してください")
	}
	for _, c := range in.Categories {
		if c.MonthlyAmount < 0 {
			return nil, domain.NewValidation("カテゴリ予算は0円以上で入力してください")
		}
	}
	return uc.budgets.Set(ctx, userID, in)
}

// CheckAlert は当月の支出が予算（総額/カテゴリ別）を超えているか判定し、
// 有効かつ当月未通知なら一度だけメールを送る。
func (uc *BudgetUsecase) CheckAlert(ctx context.Context, userID string) (*entity.BudgetAlertStatus, error) {
	b, err := uc.Get(ctx, userID)
	if err != nil {
		return nil, err
	}
	now := uc.now().In(jst)
	year, month := now.Year(), int(now.Month())

	exps, err := uc.expenses.List(ctx, userID, repository.ExpenseFilter{Year: year})
	if err != nil {
		return nil, err
	}
	monthTotal := 0
	perCat := map[string]int{}
	for _, e := range exps {
		if int(e.ExpenseDate.In(jst).Month()) != month {
			continue
		}
		monthTotal += e.Amount
		perCat[e.Category] += e.Amount
	}

	overCats := make([]string, 0)
	for _, c := range b.Categories {
		if c.MonthlyAmount > 0 && perCat[c.Category] > c.MonthlyAmount {
			overCats = append(overCats, c.Category)
		}
	}
	overTotal := b.MonthlyAmount > 0 && monthTotal > b.MonthlyAmount
	status := &entity.BudgetAlertStatus{
		OverBudget:     overTotal || len(overCats) > 0,
		MonthTotal:     monthTotal,
		MonthlyAmount:  b.MonthlyAmount,
		OverCategories: overCats,
	}

	monthKey := fmt.Sprintf("%04d-%02d", year, month)
	alreadyAlerted := b.LastAlertedMonth != nil && *b.LastAlertedMonth == monthKey
	if status.OverBudget && b.AlertEnabled && !alreadyAlerted {
		if u, e := uc.users.FindByID(ctx, userID); e == nil && u != nil {
			// メール送信は best-effort（失敗してもアラート表示は行う）
			_ = uc.mail.SendBudgetAlert(ctx, u.Email, monthKey, monthTotal, b.MonthlyAmount)
		}
		if e := uc.budgets.MarkAlerted(ctx, userID, monthKey); e == nil {
			status.EmailSent = true
		}
	}
	return status, nil
}
