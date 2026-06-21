package domain

// ドメイン層の例外。HTTP非依存。response.HandleDomainError がHTTPに変換する。

// NotFoundError はリソース未検出
type NotFoundError struct{ Message string }

func (e *NotFoundError) Error() string { return e.Message }

func NewNotFound(resource string) *NotFoundError {
	return &NotFoundError{Message: resource + "が見つかりません"}
}

// ConflictError は重複・競合
type ConflictError struct{ Message string }

func (e *ConflictError) Error() string { return e.Message }

func NewConflict(msg string) *ConflictError { return &ConflictError{Message: msg} }

// ValidationError は入力検証エラー
type ValidationError struct{ Message string }

func (e *ValidationError) Error() string { return e.Message }

func NewValidation(msg string) *ValidationError { return &ValidationError{Message: msg} }

// ForbiddenError はリソース所有権違反など
type ForbiddenError struct{ Message string }

func (e *ForbiddenError) Error() string { return e.Message }

func NewForbidden(msg string) *ForbiddenError { return &ForbiddenError{Message: msg} }
