package router

import (
	"testing"
	"time"

	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/interface/handler"
	"healthfamily/internal/pkg/auth"
	"healthfamily/internal/pkg/mailer"
	"healthfamily/internal/usecase"
)

// ルート登録時に panic しない（静的/パラメータ競合がない）ことを確認する
func TestSetupRegistersWithoutPanic(t *testing.T) {
	db := &database.DB{}
	tm := auth.NewTokenManager("test-secret", time.Hour)
	h := &Handlers{
		Auth:       handler.NewAuthHandler(usecase.NewAuthUsecase(nil, tm, mailer.NewResendMailer("", ""))),
		Member:     handler.NewMemberHandler(usecase.NewMemberUsecase(nil)),
		Medication: handler.NewMedicationHandler(usecase.NewMedicationUsecase(nil, nil)),
		Schedule:   handler.NewScheduleHandler(usecase.NewScheduleUsecase(nil, nil)),
		Record:     handler.NewRecordHandler(usecase.NewRecordUsecase(nil, nil, nil)),
		Expense:    handler.NewExpenseHandler(usecase.NewExpenseUsecase(nil, nil)),
	}
	engine := Setup(h, tm, db, []string{"http://localhost:5173"})
	if engine == nil {
		t.Fatal("engine is nil")
	}
	if len(engine.Routes()) == 0 {
		t.Fatal("no routes registered")
	}
	t.Logf("registered %d routes", len(engine.Routes()))
}
