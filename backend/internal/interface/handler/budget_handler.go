package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// BudgetHandler は月次予算・カテゴリ別予算・予算超過アラートのエンドポイント
type BudgetHandler struct {
	uc *usecase.BudgetUsecase
}

func NewBudgetHandler(uc *usecase.BudgetUsecase) *BudgetHandler {
	return &BudgetHandler{uc: uc}
}

func (h *BudgetHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	b, err := h.uc.Get(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, b)
}

type categoryBudgetReq struct {
	Category      string `json:"category"`
	MonthlyAmount int    `json:"monthlyAmount"`
}

type setBudgetRequest struct {
	MonthlyAmount int                 `json:"monthlyAmount"`
	AlertEnabled  *bool               `json:"alertEnabled"`
	Categories    []categoryBudgetReq `json:"categories"`
}

func (h *BudgetHandler) Set(c *gin.Context) {
	userID := middleware.UserID(c)
	var req setBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	alertEnabled := true
	if req.AlertEnabled != nil {
		alertEnabled = *req.AlertEnabled
	}
	cats := make([]entity.CategoryBudget, 0, len(req.Categories))
	for _, c := range req.Categories {
		cats = append(cats, entity.CategoryBudget{Category: c.Category, MonthlyAmount: c.MonthlyAmount})
	}
	b, err := h.uc.Set(c.Request.Context(), userID, repository.SetBudgetInput{
		MonthlyAmount: req.MonthlyAmount,
		AlertEnabled:  alertEnabled,
		Categories:    cats,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, b)
}

// Alert は当月の予算超過を判定し、必要ならメール通知する。
func (h *BudgetHandler) Alert(c *gin.Context) {
	userID := middleware.UserID(c)
	status, err := h.uc.CheckAlert(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, status)
}
