package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// DashboardPreferenceHandler はダッシュボードのパーソナライズ設定エンドポイント
type DashboardPreferenceHandler struct {
	uc *usecase.DashboardPreferenceUsecase
}

func NewDashboardPreferenceHandler(uc *usecase.DashboardPreferenceUsecase) *DashboardPreferenceHandler {
	return &DashboardPreferenceHandler{uc: uc}
}

func (h *DashboardPreferenceHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	p, err := h.uc.Get(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, p)
}

type setDashboardPrefRequest struct {
	HiddenCards     []string `json:"hiddenCards"`
	CardOrder       []string `json:"cardOrder"`
	DefaultMemberID *string  `json:"defaultMemberId"`
}

func (h *DashboardPreferenceHandler) Set(c *gin.Context) {
	userID := middleware.UserID(c)
	var req setDashboardPrefRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	p, err := h.uc.Set(c.Request.Context(), userID, req.HiddenCards, req.CardOrder, req.DefaultMemberID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, p)
}
