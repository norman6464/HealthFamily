package router

import (
	"github.com/gin-gonic/gin"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/persistence"
	"healthfamily/internal/interface/handler"
	"healthfamily/internal/usecase"
)

// RegisterExtraRoutes は拡張リソースのリポジトリ/ユースケース/ハンドラを組み立て、
// 認証済みグループにルートを登録する。
func RegisterExtraRoutes(authed *gin.RouterGroup, db *database.DB) {
	// 所有権チェック用の共有リポジトリ
	memberRepo := persistence.NewMemberRepository(db)
	userRepo := persistence.NewUserRepository(db)

	// --- Hospital ---
	hospitalH := handler.NewHospitalHandler(usecase.NewHospitalUsecase(persistence.NewHospitalRepository(db)))
	authed.GET("/hospitals", hospitalH.List)
	authed.POST("/hospitals", hospitalH.Create)
	authed.GET("/hospitals/:hospitalId", hospitalH.Get)
	authed.PATCH("/hospitals/:hospitalId", hospitalH.Update)
	authed.DELETE("/hospitals/:hospitalId", hospitalH.Delete)

	// --- Appointment ---
	appointmentH := handler.NewAppointmentHandler(usecase.NewAppointmentUsecase(persistence.NewAppointmentRepository(db), memberRepo))
	authed.GET("/appointments", appointmentH.List)
	authed.POST("/appointments", appointmentH.Create)
	authed.GET("/appointments/:appointmentId", appointmentH.Get)
	authed.PATCH("/appointments/:appointmentId", appointmentH.Update)
	authed.DELETE("/appointments/:appointmentId", appointmentH.Delete)

	// --- HealthLog ---
	healthLogH := handler.NewHealthLogHandler(usecase.NewHealthLogUsecase(persistence.NewHealthLogRepository(db), memberRepo))
	authed.GET("/health-logs", healthLogH.List)
	authed.POST("/health-logs", healthLogH.Create)
	authed.GET("/health-logs/:logId", healthLogH.Get)
	authed.PATCH("/health-logs/:logId", healthLogH.Update)
	authed.DELETE("/health-logs/:logId", healthLogH.Delete)

	// --- Vaccination ---
	vaccinationH := handler.NewVaccinationHandler(usecase.NewVaccinationUsecase(persistence.NewVaccinationRepository(db), memberRepo))
	authed.GET("/vaccinations", vaccinationH.List)
	authed.POST("/vaccinations", vaccinationH.Create)
	authed.GET("/vaccinations/:vaccinationId", vaccinationH.Get)
	authed.PATCH("/vaccinations/:vaccinationId", vaccinationH.Update)
	authed.DELETE("/vaccinations/:vaccinationId", vaccinationH.Delete)

	// --- Examination ---
	examinationH := handler.NewExaminationHandler(usecase.NewExaminationUsecase(persistence.NewExaminationRepository(db), memberRepo))
	authed.GET("/examinations", examinationH.List)
	authed.POST("/examinations", examinationH.Create)
	authed.GET("/examinations/:examinationId", examinationH.Get)
	authed.PATCH("/examinations/:examinationId", examinationH.Update)
	authed.DELETE("/examinations/:examinationId", examinationH.Delete)

	// --- Insurance ---
	insuranceH := handler.NewInsuranceHandler(usecase.NewInsuranceUsecase(persistence.NewInsuranceRepository(db), memberRepo))
	authed.GET("/insurances", insuranceH.List)
	authed.POST("/insurances", insuranceH.Create)
	authed.GET("/insurances/:insuranceId", insuranceH.Get)
	authed.PATCH("/insurances/:insuranceId", insuranceH.Update)
	authed.DELETE("/insurances/:insuranceId", insuranceH.Delete)

	// --- Allergy ---
	allergyH := handler.NewAllergyHandler(usecase.NewAllergyUsecase(persistence.NewAllergyRepository(db), memberRepo))
	authed.GET("/allergies", allergyH.List)
	authed.POST("/allergies", allergyH.Create)
	authed.GET("/allergies/:allergyId", allergyH.Get)
	authed.PATCH("/allergies/:allergyId", allergyH.Update)
	authed.DELETE("/allergies/:allergyId", allergyH.Delete)

	// --- BodyMeasurement ---
	bodyH := handler.NewBodyMeasurementHandler(usecase.NewBodyMeasurementUsecase(persistence.NewBodyMeasurementRepository(db), memberRepo))
	authed.GET("/body-measurements", bodyH.List)
	authed.POST("/body-measurements", bodyH.Create)
	authed.GET("/body-measurements/:measurementId", bodyH.Get)
	authed.PATCH("/body-measurements/:measurementId", bodyH.Update)
	authed.DELETE("/body-measurements/:measurementId", bodyH.Delete)

	// --- TemperatureRecord ---
	tempH := handler.NewTemperatureRecordHandler(usecase.NewTemperatureRecordUsecase(persistence.NewTemperatureRecordRepository(db), memberRepo))
	authed.GET("/temperature-records", tempH.List)
	authed.POST("/temperature-records", tempH.Create)
	authed.GET("/temperature-records/member/:memberId", tempH.ListByMember)
	authed.GET("/temperature-records/:recordId", tempH.Get)
	authed.PATCH("/temperature-records/:recordId", tempH.Update)
	authed.DELETE("/temperature-records/:recordId", tempH.Delete)

	// --- EmergencyContact ---
	contactH := handler.NewEmergencyContactHandler(usecase.NewEmergencyContactUsecase(persistence.NewEmergencyContactRepository(db), memberRepo))
	authed.GET("/emergency-contacts", contactH.List)
	authed.POST("/emergency-contacts", contactH.Create)
	authed.GET("/emergency-contacts/:contactId", contactH.Get)
	authed.PATCH("/emergency-contacts/:contactId", contactH.Update)
	authed.DELETE("/emergency-contacts/:contactId", contactH.Delete)

	// --- Prescription ---
	prescriptionH := handler.NewPrescriptionHandler(usecase.NewPrescriptionUsecase(persistence.NewPrescriptionRepository(db), memberRepo, persistence.NewMedicationRepository(db)))
	authed.GET("/prescriptions", prescriptionH.List)
	authed.POST("/prescriptions", prescriptionH.Create)
	authed.GET("/prescriptions/:prescriptionId", prescriptionH.Get)
	authed.PATCH("/prescriptions/:prescriptionId", prescriptionH.Update)
	authed.DELETE("/prescriptions/:prescriptionId", prescriptionH.Delete)
	authed.PUT("/prescriptions/:prescriptionId/items", prescriptionH.SetItems)
	authed.POST("/prescriptions/:prescriptionId/dispense", prescriptionH.Dispense)

	// --- NotificationSetting ---
	notifH := handler.NewNotificationSettingHandler(usecase.NewNotificationSettingUsecase(persistence.NewNotificationSettingRepository(db)))
	authed.GET("/notification-settings", notifH.Get)
	authed.PUT("/notification-settings", notifH.Upsert)

	// --- UserProfile ---
	profileH := handler.NewUserProfileHandler(usecase.NewUserProfileUsecase(userRepo))
	authed.GET("/users/me", profileH.Me)
	authed.PATCH("/users/me", profileH.Update)
}
