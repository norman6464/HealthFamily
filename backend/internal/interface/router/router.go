package router

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/interface/handler"
	"healthfamily/internal/interface/middleware"
	"healthfamily/internal/pkg/auth"
)

// Handlers はルーターに必要なハンドラ群
type Handlers struct {
	Auth       *handler.AuthHandler
	Member     *handler.MemberHandler
	Medication *handler.MedicationHandler
	Schedule   *handler.ScheduleHandler
	Record     *handler.RecordHandler
	Expense    *handler.ExpenseHandler
	Budget     *handler.BudgetHandler
	Dashboard  *handler.DashboardPreferenceHandler
}

// Setup はGinエンジンを構築する
//
// trustedProxyHops は自分たちの基盤が X-Forwarded-For に足す段数。
// Cloud Run に直接ぶら下げる場合は 1、前段が無ければ 0。
// 詳しくは middleware.ResolveClientIP を参照。
func Setup(h *Handlers, tm *auth.TokenManager, tokenVersions middleware.TokenVersionLookup, db *database.DB, allowedOrigins []string, trustedProxyHops int) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	corsCfg := cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	r.Use(cors.New(corsCfg))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api")

	// --- 認証（公開） ---
	authGroup := api.Group("/auth")
	{
		ipLimit := func(name string, max int) gin.HandlerFunc {
			return middleware.RateLimit(name, max, time.Minute, trustedProxyHops, nil)
		}
		authGroup.POST("/signup", ipLimit("signup", 10), h.Auth.SignUp)
		authGroup.POST("/verify", ipLimit("verify", 20), h.Auth.Verify)
		authGroup.POST("/login", ipLimit("login", 20), h.Auth.Login)
		authGroup.POST("/google", ipLimit("google", 20), h.Auth.GoogleLogin)
		authGroup.POST("/google/callback", ipLimit("google-callback", 20), h.Auth.GoogleCallback)
		authGroup.POST("/resend-code", ipLimit("resend", 5), h.Auth.ResendCode)
		authGroup.POST("/forgot-password", ipLimit("forgot", 5), h.Auth.ForgotPassword)
		authGroup.POST("/reset-password", ipLimit("reset", 5), h.Auth.ResetPassword)
		// E2Eテスト用ログインバイパス（E2E_TEST_LOGIN_SECRET 設定時のみ登録。本番では無効）
		if h.Auth.TestLoginEnabled() {
			authGroup.POST("/test-login", h.Auth.TestLogin)
		}
	}

	// --- 認証必須 ---
	authed := api.Group("")
	authed.Use(middleware.Auth(tm, tokenVersions))
	authed.Use(middleware.RateLimit("api", 120, time.Minute, trustedProxyHops, middleware.PerUser))
	{
		authed.GET("/members", h.Member.List)
		authed.GET("/members/summary", h.Member.Summary)
		authed.POST("/members", h.Member.Create)
		authed.GET("/members/:memberId", h.Member.Get)
		authed.PATCH("/members/:memberId", h.Member.Update)
		authed.DELETE("/members/:memberId", h.Member.Delete)
		authed.GET("/members/:memberId/medications", h.Medication.ListByMember)
		authed.GET("/members/:memberId/records", h.Record.ListByMember)

		authed.GET("/medications", h.Medication.ListByUser)
		authed.GET("/medications/alerts", h.Medication.Alerts)
		authed.POST("/medications", h.Medication.Create)
		authed.POST("/medications/reorder", h.Medication.Reorder)
		authed.GET("/medications/:medicationId", h.Medication.Get)
		authed.PATCH("/medications/:medicationId", h.Medication.Update)
		authed.DELETE("/medications/:medicationId", h.Medication.Delete)
		authed.PATCH("/medications/:medicationId/stock", h.Medication.UpdateStock)

		authed.GET("/schedules", h.Schedule.List)
		authed.POST("/schedules", h.Schedule.Create)
		authed.GET("/schedules/today", h.Schedule.Today)
		authed.PATCH("/schedules/:scheduleId", h.Schedule.Update)
		authed.DELETE("/schedules/:scheduleId", h.Schedule.Delete)

		authed.GET("/records", h.Record.ListByUser)
		authed.POST("/records", h.Record.Create)
		authed.DELETE("/records/:recordId", h.Record.Delete)

		// 医療費・健康支出管理(医療費控除対応)
		authed.GET("/expenses", h.Expense.List)
		authed.GET("/expenses/summary", h.Expense.Summary)
		authed.POST("/expenses", h.Expense.Create)
		authed.POST("/expenses/import", h.Expense.Import)
		authed.PATCH("/expenses/:expenseId", h.Expense.Update)
		authed.DELETE("/expenses/:expenseId", h.Expense.Delete)

		// 月次予算（カテゴリ別・アラート含むパーソナライズ）
		authed.GET("/budget", h.Budget.Get)
		authed.PUT("/budget", h.Budget.Set)
		authed.POST("/budget/alert", h.Budget.Alert)

		// ダッシュボードのパーソナライズ設定
		authed.GET("/dashboard-preferences", h.Dashboard.Get)
		authed.PUT("/dashboard-preferences", h.Dashboard.Set)

		// 残りリソース（病院・予約・健康ログ・予防接種・検査・保険・アレルギー・
		// 身体測定・体温・緊急連絡先・処方箋・通知設定・ユーザープロフィール）
		RegisterExtraRoutes(authed, db)
	}

	return r
}
