package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// BudgetHandler は月次予算エンドポイント
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

type setBudgetRequest struct {
	MonthlyAmount int `json:"monthlyAmount"`
}

func (h *BudgetHandler) Set(c *gin.Context) {
	userID := middleware.UserID(c)
	var req setBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	b, err := h.uc.Set(c.Request.Context(), userID, req.MonthlyAmount)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, b)
}
