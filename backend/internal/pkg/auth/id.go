package auth

import "github.com/google/uuid"

// NewID は新しいエンティティIDを生成する（UUID v4）
func NewID() string {
	return uuid.NewString()
}
