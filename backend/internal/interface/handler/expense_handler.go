package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// ExpenseHandler は医療費・健康支出エンドポイント
type ExpenseHandler struct {
	uc *usecase.ExpenseUsecase
}

func NewExpenseHandler(uc *usecase.ExpenseUsecase) *ExpenseHandler {
	return &ExpenseHandler{uc: uc}
}

func (h *ExpenseHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	f := repository.ExpenseFilter{MemberID: c.Query("memberId")}
	if y := c.Query("year"); y != "" {
		if v, err := strconv.Atoi(y); err == nil {
			f.Year = v
		}
	}
	list, err := h.uc.List(c.Request.Context(), userID, f)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *ExpenseHandler) Summary(c *gin.Context) {
	userID := middleware.UserID(c)
	year := time.Now().Year()
	if y := c.Query("year"); y != "" {
		if v, err := strconv.Atoi(y); err == nil && v > 0 {
			year = v
		}
	}
	summary, err := h.uc.Summary(c.Request.Context(), userID, year)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, summary)
}

type createExpenseRequest struct {
	MemberID     *string `json:"memberId"`
	Category     string  `json:"category" binding:"required"`
	Amount       int     `json:"amount"`
	Description  *string `json:"description"`
	ExpenseDate  string  `json:"expenseDate" binding:"required"`
	IsDeductible *bool   `json:"isDeductible"`
}

func (h *ExpenseHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "カテゴリと支出日は必須です")
		return
	}
	date := parseDate(&req.ExpenseDate)
	if date == nil {
		response.Error(c, 400, "支出日の形式が正しくありません")
		return
	}
	deductible := true
	if req.IsDeductible != nil {
		deductible = *req.IsDeductible
	}
	e, err := h.uc.Create(c.Request.Context(), repository.CreateExpenseInput{
		UserID:       userID,
		MemberID:     req.MemberID,
		Category:     req.Category,
		Amount:       req.Amount,
		Description:  req.Description,
		ExpenseDate:  *date,
		IsDeductible: deductible,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, e)
}

type updateExpenseRequest struct {
	MemberID     *string `json:"memberId"`
	Category     *string `json:"category"`
	Amount       *int    `json:"amount"`
	Description  *string `json:"description"`
	ExpenseDate  *string `json:"expenseDate"`
	IsDeductible *bool   `json:"isDeductible"`
}

func (h *ExpenseHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	e, err := h.uc.Update(c.Request.Context(), userID, c.Param("expenseId"), repository.UpdateExpenseInput{
		MemberID:     req.MemberID,
		Category:     req.Category,
		Amount:       req.Amount,
		Description:  req.Description,
		ExpenseDate:  parseDate(req.ExpenseDate),
		IsDeductible: req.IsDeductible,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, e)
}

type importExpenseRow struct {
	MemberID     *string `json:"memberId"`
	Category     string  `json:"category"`
	Amount       int     `json:"amount"`
	Description  *string `json:"description"`
	ExpenseDate  string  `json:"expenseDate"`
	IsDeductible *bool   `json:"isDeductible"`
}

type importExpensesRequest struct {
	Expenses []importExpenseRow `json:"expenses" binding:"required"`
}

// Import は CSV/医療費通知から変換した支出を一括登録する。
func (h *ExpenseHandler) Import(c *gin.Context) {
	userID := middleware.UserID(c)
	var req importExpensesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "取込データが正しくありません")
		return
	}
	inputs := make([]repository.CreateExpenseInput, 0, len(req.Expenses))
	for _, row := range req.Expenses {
		date := parseDate(&row.ExpenseDate)
		if date == nil {
			continue // 日付不正はスキップ
		}
		deductible := true
		if row.IsDeductible != nil {
			deductible = *row.IsDeductible
		}
		inputs = append(inputs, repository.CreateExpenseInput{
			UserID:       userID,
			MemberID:     row.MemberID,
			Category:     row.Category,
			Amount:       row.Amount,
			Description:  row.Description,
			ExpenseDate:  *date,
			IsDeductible: deductible,
		})
	}
	imported, skipped, err := h.uc.ImportMany(c.Request.Context(), inputs)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, gin.H{"imported": imported, "skipped": skipped})
}

func (h *ExpenseHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("expenseId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
