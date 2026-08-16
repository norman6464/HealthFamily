package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// UserProfileUsecase はユーザープロフィールのビジネスロジック
type UserProfileUsecase struct {
	users repository.UserRepository
}

func NewUserProfileUsecase(users repository.UserRepository) *UserProfileUsecase {
	return &UserProfileUsecase{users: users}
}

// UpdateProfileInput はプロフィール更新入力（nilは未変更）
type UpdateProfileInput struct {
	DisplayName   *string
	CharacterType *string
	CharacterName *string
}

func (uc *UserProfileUsecase) Get(ctx context.Context, userID string) (*entity.User, error) {
	u, err := uc.users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, domain.NewNotFound("ユーザー")
	}
	return u, nil
}

func (uc *UserProfileUsecase) Update(ctx context.Context, userID string, in UpdateProfileInput) (*entity.User, error) {
	u, err := uc.users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, domain.NewNotFound("ユーザー")
	}
	if in.DisplayName != nil {
		u.DisplayName = in.DisplayName
	}
	if in.CharacterType != nil {
		u.CharacterType = *in.CharacterType
	}
	if in.CharacterName != nil {
		u.CharacterName = in.CharacterName
	}
	if err := uc.users.UpdateProfile(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}
