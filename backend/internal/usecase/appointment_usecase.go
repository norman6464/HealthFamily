package usecase

import (
	"context"

	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// AppointmentUsecase は通院予定のユースケース。
//
// メンバー紐付けの汎用CRUD (MemberScopedCRUD) に、通院予定固有の
// 「hospitalId も自分の病院か」の確認を足したもの。
//
// 汎用CRUD は memberId しか見ないため、hospitalId は素通しになっていた。
// 他人の病院IDを推測して自分の通院予定に紐付ければ、その病院の情報を
// 自分の画面へ引き込めてしまう。
type AppointmentUsecase struct {
	crud      *MemberScopedCRUD[entity.Appointment, repository.CreateAppointmentInput, repository.UpdateAppointmentInput]
	hospitals repository.HospitalRepository
}

func NewAppointmentUsecase(
	crud *MemberScopedCRUD[entity.Appointment, repository.CreateAppointmentInput, repository.UpdateAppointmentInput],
	hospitals repository.HospitalRepository,
) *AppointmentUsecase {
	return &AppointmentUsecase{crud: crud, hospitals: hospitals}
}

func (uc *AppointmentUsecase) List(ctx context.Context, userID string) ([]entity.Appointment, error) {
	return uc.crud.List(ctx, userID)
}

func (uc *AppointmentUsecase) Get(ctx context.Context, userID, id string) (*entity.Appointment, error) {
	return uc.crud.Get(ctx, userID, id)
}

func (uc *AppointmentUsecase) Create(ctx context.Context, in repository.CreateAppointmentInput) (*entity.Appointment, error) {
	if err := ensureHospitalOwner(ctx, uc.hospitals, in.UserID, in.HospitalID); err != nil {
		return nil, err
	}
	return uc.crud.Create(ctx, in)
}

func (uc *AppointmentUsecase) Update(ctx context.Context, userID, id string, in repository.UpdateAppointmentInput) (*entity.Appointment, error) {
	// 更新で他人の病院へ付け替える経路も塞ぐ
	if err := ensureHospitalOwner(ctx, uc.hospitals, userID, in.HospitalID); err != nil {
		return nil, err
	}
	return uc.crud.Update(ctx, userID, id, in)
}

func (uc *AppointmentUsecase) Delete(ctx context.Context, userID, id string) error {
	return uc.crud.Delete(ctx, userID, id)
}
