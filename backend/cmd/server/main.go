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
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/interface/router"
	"healthfamily/internal/pkg/auth"
	"healthfamily/internal/pkg/googleauth"
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
	var google googleauth.Verifier
	if cfg.GoogleClientID != "" {
		google = googleauth.New(cfg.GoogleClientID)
		log.Println("google login enabled")
	}

	userRepo := persistence.NewUserRepository(db)
	memberRepo := persistence.NewMemberRepository(db)
	medRepo := persistence.NewMedicationRepository(db)
	schedRepo := persistence.NewScheduleRepository(db)
	recordRepo := persistence.NewMedicationRecordRepository(db)
	expenseRepo := persistence.NewExpenseRepository(db)
	budgetRepo := persistence.NewBudgetRepository(db)
	dashboardPrefRepo := persistence.NewDashboardPreferenceRepository(db)

	authUsecase := usecase.NewAuthUsecase(userRepo, tm, mail, google)
	// client_secret がある時だけ認可コードグラントを有効にする。
	// 中途半端に有効化すると、失敗の理由が分かりにくい形で表に出る
	if cfg.GoogleClientID != "" && cfg.GoogleClientSecret != "" {
		authUsecase.WithGoogleExchanger(
			googleauth.NewExchanger(cfg.GoogleClientID, cfg.GoogleClientSecret, googleauth.TokenEndpoint, nil),
		)
	}

	handlers := &router.Handlers{
		Auth:       handler.NewAuthHandler(authUsecase),
		Member:     handler.NewMemberHandler(usecase.NewMemberUsecase(memberRepo)),
		Medication: handler.NewMedicationHandler(usecase.NewMedicationUsecase(medRepo, memberRepo)),
		Schedule:   handler.NewScheduleHandler(usecase.NewScheduleUsecase(schedRepo, medRepo)),
		Record:     handler.NewRecordHandler(usecase.NewRecordUsecase(recordRepo, medRepo, memberRepo)),
		Expense:    handler.NewExpenseHandler(usecase.NewExpenseUsecase(expenseRepo, memberRepo)),
		Budget:     handler.NewBudgetHandler(usecase.NewBudgetUsecase(budgetRepo, expenseRepo, userRepo, mail)),
		Dashboard:  handler.NewDashboardPreferenceHandler(usecase.NewDashboardPreferenceUsecase(dashboardPrefRepo)),
	}

	// 永続化層が middleware を知らずに済むよう、両者の結び付けはここで閉じる
	tokenVersions := middleware.TokenVersionFunc(func(ctx context.Context, userID string) (int, error) {
		v, found, err := userRepo.TokenVersion(ctx, userID)
		if err != nil {
			return 0, err
		}
		if !found {
			return 0, middleware.ErrUserNotFound
		}
		return v, nil
	})

	engine := router.Setup(handlers, tm, tokenVersions, db, cfg.AllowedOrigins, cfg.TrustedProxyHops)

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
