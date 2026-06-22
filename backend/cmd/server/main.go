package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"healthfamily/internal/config"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/persistence"
	"healthfamily/internal/interface/handler"
	"healthfamily/internal/interface/router"
	"healthfamily/internal/pkg/auth"
	"healthfamily/internal/pkg/mailer"
	"healthfamily/internal/usecase"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx := context.Background()
	db, err := database.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer db.Close()

	// マイグレーション（冪等）
	if dir := os.Getenv("MIGRATIONS_DIR"); dir != "" {
		if err := db.Migrate(ctx, dir); err != nil {
			log.Fatalf("migrate: %v", err)
		}
		log.Println("migrations applied")
	}

	// 依存組み立て（DI）
	tm := auth.NewTokenManager(cfg.JWTSecret, 7*24*time.Hour)
	mail := mailer.NewResendMailer(cfg.ResendAPIKey, cfg.MailFrom)

	userRepo := persistence.NewUserRepository(db)
	memberRepo := persistence.NewMemberRepository(db)
	medRepo := persistence.NewMedicationRepository(db)
	schedRepo := persistence.NewScheduleRepository(db)
	recordRepo := persistence.NewMedicationRecordRepository(db)
	expenseRepo := persistence.NewExpenseRepository(db)

	handlers := &router.Handlers{
		Auth:       handler.NewAuthHandler(usecase.NewAuthUsecase(userRepo, tm, mail)),
		Member:     handler.NewMemberHandler(usecase.NewMemberUsecase(memberRepo)),
		Medication: handler.NewMedicationHandler(usecase.NewMedicationUsecase(medRepo, memberRepo)),
		Schedule:   handler.NewScheduleHandler(usecase.NewScheduleUsecase(schedRepo, medRepo)),
		Record:     handler.NewRecordHandler(usecase.NewRecordUsecase(recordRepo, medRepo, memberRepo)),
		Expense:    handler.NewExpenseHandler(usecase.NewExpenseUsecase(expenseRepo, memberRepo)),
	}

	engine := router.Setup(handlers, tm, db, cfg.AllowedOrigins)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           engine,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("server listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("shutdown: %v", err)
	}
}
