package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"gorm.io/gorm"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/sqlc/sqlcgen"
	"healthfamily/internal/pkg/auth"
)

// HospitalRepository は "Hospital" テーブルのリポジトリ。
// 検索系(List/FindByID)は sqlc、書き込み系(Create/Update/Delete)は GORM を使う。
type HospitalRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewHospitalRepository(db *database.DB) *HospitalRepository {
	return &HospitalRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func hospitalFromSqlc(h sqlcgen.Hospital) entity.Hospital {
	return entity.Hospital{
		ID:           h.ID,
		UserID:       h.UserId,
		Name:         h.Name,
		HospitalType: h.HospitalType,
		Address:      h.Address,
		PhoneNumber:  h.PhoneNumber,
		Department:   h.Department,
		DoctorName:   h.DoctorName,
		Notes:        h.Notes,
		CreatedAt:    h.CreatedAt,
	}
}

func (r *HospitalRepository) List(ctx context.Context, userID string) ([]entity.Hospital, error) {
	rows, err := r.q.ListHospitals(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.Hospital, 0, len(rows))
	for _, h := range rows {
		list = append(list, hospitalFromSqlc(h))
	}
	return list, nil
}

func (r *HospitalRepository) FindByID(ctx context.Context, id string) (*entity.Hospital, error) {
	h, err := r.q.GetHospital(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := hospitalFromSqlc(h)
	return &e, nil
}

func (r *HospitalRepository) Create(ctx context.Context, in repository.CreateHospitalInput) (*entity.Hospital, error) {
	m := gormHospital{
		ID:           auth.NewID(),
		UserID:       in.UserID,
		Name:         in.Name,
		HospitalType: in.HospitalType,
		Address:      in.Address,
		PhoneNumber:  in.PhoneNumber,
		Department:   in.Department,
		DoctorName:   in.DoctorName,
		Notes:        in.Notes,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *HospitalRepository) Update(ctx context.Context, id string, in repository.UpdateHospitalInput) (*entity.Hospital, error) {
	fields := map[string]any{}
	if in.Name != nil {
		fields["name"] = *in.Name
	}
	if in.HospitalType != nil {
		fields["hospitalType"] = *in.HospitalType
	}
	if in.Address != nil {
		fields["address"] = *in.Address
	}
	if in.PhoneNumber != nil {
		fields["phoneNumber"] = *in.PhoneNumber
	}
	if in.Department != nil {
		fields["department"] = *in.Department
	}
	if in.DoctorName != nil {
		fields["doctorName"] = *in.DoctorName
	}
	if in.Notes != nil {
		fields["notes"] = *in.Notes
	}
	if len(fields) > 0 {
		if err := r.gdb.WithContext(ctx).Model(&gormHospital{}).
			Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(ctx, id)
}

func (r *HospitalRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormHospital{}).Error
}
