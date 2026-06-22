package handler

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/response"
	"healthfamily/internal/usecase"
)

// MemberHandler はメンバーエンドポイント
type MemberHandler struct {
	uc *usecase.MemberUsecase
}

func NewMemberHandler(uc *usecase.MemberUsecase) *MemberHandler {
	return &MemberHandler{uc: uc}
}

func (h *MemberHandler) List(c *gin.Context) {
	userID := middleware.UserID(c)
	members, err := h.uc.List(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, members)
}

func (h *MemberHandler) Summary(c *gin.Context) {
	userID := middleware.UserID(c)
	list, err := h.uc.ListSummary(c.Request.Context(), userID)
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, list)
}

func (h *MemberHandler) Get(c *gin.Context) {
	userID := middleware.UserID(c)
	m, err := h.uc.Get(c.Request.Context(), userID, c.Param("memberId"))
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, m)
}

type createMemberRequest struct {
	Name       string  `json:"name" binding:"required,max=100"`
	MemberType string  `json:"memberType"`
	PetType    *string `json:"petType"`
	BirthDate  *string `json:"birthDate"`
	Notes      *string `json:"notes"`
}

func (h *MemberHandler) Create(c *gin.Context) {
	userID := middleware.UserID(c)
	var req createMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "名前は必須です")
		return
	}
	m, err := h.uc.Create(c.Request.Context(), repository.CreateMemberInput{
		UserID:     userID,
		Name:       req.Name,
		MemberType: req.MemberType,
		PetType:    req.PetType,
		BirthDate:  parseDate(req.BirthDate),
		Notes:      req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Created(c, m)
}

type updateMemberRequest struct {
	Name      *string `json:"name"`
	PetType   *string `json:"petType"`
	BirthDate *string `json:"birthDate"`
	Notes     *string `json:"notes"`
}

func (h *MemberHandler) Update(c *gin.Context) {
	userID := middleware.UserID(c)
	var req updateMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "入力内容が正しくありません")
		return
	}
	m, err := h.uc.Update(c.Request.Context(), userID, c.Param("memberId"), repository.UpdateMemberInput{
		Name:      req.Name,
		PetType:   req.PetType,
		BirthDate: parseDate(req.BirthDate),
		Notes:     req.Notes,
	})
	if err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, m)
}

func (h *MemberHandler) Delete(c *gin.Context) {
	userID := middleware.UserID(c)
	if err := h.uc.Delete(c.Request.Context(), userID, c.Param("memberId")); err != nil {
		response.HandleDomainError(c, err)
		return
	}
	response.Success(c, gin.H{"ok": true})
}
