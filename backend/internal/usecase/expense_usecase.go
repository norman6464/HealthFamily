package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// 許可カテゴリ。これ以外は不正として保存させない。
var validExpenseCategories = map[string]bool{
	"medication": true, // 薬・処方
	"hospital":   true, // 診察・治療
	"pharmacy":   true, // 薬局
	"insurance":  true, // 保険料
	"checkup":    true, // 健診・検査
	"pet":        true, // ペット医療
	"transport":  true, // 通院交通費(控除対象になり得る)
	"other":      true,
}

// ExpenseUsecase は医療費・健康支出のビジネスロジック（不完全/不正な入力を保存させないガードを持つ）
type ExpenseUsecase struct {
	expenses repository.ExpenseRepository
	members  repository.MemberRepository
}

func NewExpenseUsecase(expenses repository.ExpenseRepository, members repository.MemberRepository) *ExpenseUsecase {
	return &ExpenseUsecase{expenses: expenses, members: members}
}

func (uc *ExpenseUsecase) ensureMemberOwner(ctx context.Context, userID string, memberID *string) error {
	if memberID == nil || *memberID == "" {
		return nil // 世帯全体の支出(メンバー紐付けなし)は許可
	}
	m, err := uc.members.FindByID(ctx, *memberID)
	if err != nil {
		return err
	}
	if m == nil {
		return domain.NewNotFound("メンバー")
	}
	if m.UserID != userID {
		return domain.NewForbidden("このメンバーにアクセスする権限がありません")
	}
	return nil
}

func (uc *ExpenseUsecase) ensureOwner(ctx context.Context, userID, id string) (*entity.Expense, error) {
	e, err := uc.expenses.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if e == nil {
		return nil, domain.NewNotFound("支出")
	}
	if e.UserID != userID {
		return nil, domain.NewForbidden("この支出にアクセスする権限がありません")
	}
	return e, nil
}

func (uc *ExpenseUsecase) List(ctx context.Context, userID string, f repository.ExpenseFilter) ([]entity.Expense, error) {
	if f.MemberID != "" {
		if err := uc.ensureMemberOwner(ctx, userID, &f.MemberID); err != nil {
			return nil, err
		}
	}
	return uc.expenses.List(ctx, userID, f)
}

func (uc *ExpenseUsecase) Summary(ctx context.Context, userID string, year int) (*entity.ExpenseSummary, error) {
	if year <= 0 {
		return nil, domain.NewValidation("集計対象の年を指定してください")
	}
	s, err := uc.expenses.Summary(ctx, userID, year)
	if err != nil {
		return nil, err
	}
	// 2制度シミュレーション（簡易）
	const (
		regularThreshold = 100000 // 通常医療費控除の足切り(所得200万未満は所得5%だが所得不明のため固定)
		selfMedFloor     = 12000  // セルフメディケーション税制の足切り
		selfMedCap       = 88000  // セルフメディケーション税制の上限
	)
	s.RegularDeduction = max(0, s.DeductibleTotal-regularThreshold)
	pharmacy := s.ByCategory["pharmacy"] // 薬局(OTC)購入分をセルフメディケーション対象の概算に使う
	s.SelfMedicationDeduction = min(selfMedCap, max(0, pharmacy-selfMedFloor))
	switch {
	case s.RegularDeduction == 0 && s.SelfMedicationDeduction == 0:
		s.RecommendedScheme = "none"
	case s.RegularDeduction >= s.SelfMedicationDeduction:
		s.RecommendedScheme = "regular"
	default:
		s.RecommendedScheme = "selfmed"
	}
	return s, nil
}

// Create は入力を検証し、不完全/不正なら保存せず ValidationError を返す。
func (uc *ExpenseUsecase) Create(ctx context.Context, in repository.CreateExpenseInput) (*entity.Expense, error) {
	if in.Amount <= 0 {
		return nil, domain.NewValidation("金額は1円以上で入力してください")
	}
	if !validExpenseCategories[in.Category] {
		return nil, domain.NewValidation("カテゴリの指定が正しくありません")
	}
	if in.ExpenseDate.IsZero() {
		return nil, domain.NewValidation("支出日は必須です")
	}
	if err := uc.ensureMemberOwner(ctx, in.UserID, in.MemberID); err != nil {
		return nil, err
	}
	return uc.expenses.Create(ctx, in)
}

// Update は所有権確認と、指定された項目のみの検証を行う。
func (uc *ExpenseUsecase) Update(ctx context.Context, userID, id string, in repository.UpdateExpenseInput) (*entity.Expense, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	if in.Amount != nil && *in.Amount <= 0 {
		return nil, domain.NewValidation("金額は1円以上で入力してください")
	}
	if in.Category != nil && !validExpenseCategories[*in.Category] {
		return nil, domain.NewValidation("カテゴリの指定が正しくありません")
	}
	if err := uc.ensureMemberOwner(ctx, userID, in.MemberID); err != nil {
		return nil, err
	}
	return uc.expenses.Update(ctx, id, in)
}

func (uc *ExpenseUsecase) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.expenses.Delete(ctx, id)
}
