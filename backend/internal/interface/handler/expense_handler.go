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

func (h *ExpenseHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("expenseId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
