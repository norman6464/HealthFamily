package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/repository"
)

// ScopedRepo はユーザー所有・(作成時)メンバー紐付けリソースの標準CRUD抽象。
type ScopedRepo[E any, C any, U any] interface {
	List(ctx context.Context, userID string) ([]E, error)
	FindByID(ctx context.Context, id string) (*E, error)
	Create(ctx context.Context, in C) (*E, error)
	Update(ctx context.Context, id string, in U) (*E, error)
	Delete(ctx context.Context, id string) error
}

// MemberScopedCRUD はメンバー紐付けリソースの汎用ユースケース。
type MemberScopedCRUD[E any, C any, U any] struct {
	repo         ScopedRepo[E, C, U]
	members      repository.MemberRepository
	notFoundName string
	forbiddenMsg string
	ownerID      func(*E) string
	createUserID func(C) string
	createMember func(C) string
}

func NewMemberScopedCRUD[E any, C any, U any](
	repo ScopedRepo[E, C, U], members repository.MemberRepository,
	notFoundName, forbiddenMsg string,
	ownerID func(*E) string, createUserID func(C) string, createMember func(C) string,
) *MemberScopedCRUD[E, C, U] {
	return &MemberScopedCRUD[E, C, U]{repo, members, notFoundName, forbiddenMsg, ownerID, createUserID, createMember}
}

func (uc *MemberScopedCRUD[E, C, U]) ensureOwner(ctx context.Context, userID, id string) (*E, error) {
	e, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if e == nil {
		return nil, domain.NewNotFound(uc.notFoundName)
	}
	if uc.ownerID(e) != userID {
		return nil, domain.NewForbidden(uc.forbiddenMsg)
	}
	return e, nil
}

func (uc *MemberScopedCRUD[E, C, U]) List(ctx context.Context, userID string) ([]E, error) {
	return uc.repo.List(ctx, userID)
}

func (uc *MemberScopedCRUD[E, C, U]) Get(ctx context.Context, userID, id string) (*E, error) {
	return uc.ensureOwner(ctx, userID, id)
}

func (uc *MemberScopedCRUD[E, C, U]) Create(ctx context.Context, in C) (*E, error) {
	if err := ensureMemberOwner(ctx, uc.members, uc.createUserID(in), uc.createMember(in)); err != nil {
		return nil, err
	}
	return uc.repo.Create(ctx, in)
}

func (uc *MemberScopedCRUD[E, C, U]) Update(ctx context.Context, userID, id string, in U) (*E, error) {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return nil, err
	}
	return uc.repo.Update(ctx, id, in)
}

func (uc *MemberScopedCRUD[E, C, U]) Delete(ctx context.Context, userID, id string) error {
	if _, err := uc.ensureOwner(ctx, userID, id); err != nil {
		return err
	}
	return uc.repo.Delete(ctx, id)
}
