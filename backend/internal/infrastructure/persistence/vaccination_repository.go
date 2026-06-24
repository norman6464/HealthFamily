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

// VaccinationRepository は "Vaccination" テーブルのリポジトリ。
// 検索系(List/FindByID)は sqlc、書き込み系(Create/Update/Delete)は GORM を使う。
type VaccinationRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewVaccinationRepository(db *database.DB) *VaccinationRepository {
	return &VaccinationRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func vaccinationFromSqlc(v sqlcgen.Vaccination) entity.Vaccination {
	return entity.Vaccination{
		ID:                v.ID,
		UserID:            v.UserId,
		MemberID:          v.MemberId,
		VaccineName:       v.VaccineName,
		VaccinatedAt:      v.VaccinatedAt,
		NextScheduledDate: v.NextScheduledDate,
		Notes:             v.Notes,
		CreatedAt:         v.CreatedAt,
	}
}

func (r *VaccinationRepository) List(ctx context.Context, userID string) ([]entity.Vaccination, error) {
	rows, err := r.q.ListVaccinations(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.Vaccination, 0, len(rows))
	for _, v := range rows {
		list = append(list, vaccinationFromSqlc(v))
	}
	return list, nil
}

func (r *VaccinationRepository) FindByID(ctx context.Context, id string) (*entity.Vaccination, error) {
	v, err := r.q.GetVaccination(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := vaccinationFromSqlc(v)
	return &e, nil
}

func (r *VaccinationRepository) Create(ctx context.Context, in repository.CreateVaccinationInput) (*entity.Vaccination, error) {
	m := gormVaccination{
		ID:                auth.NewID(),
		UserID:            in.UserID,
		MemberID:          in.MemberID,
		VaccineName:       in.VaccineName,
		VaccinatedAt:      in.VaccinatedAt,
		NextScheduledDate: in.NextScheduledDate,
		Notes:             in.Notes,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *VaccinationRepository) Update(ctx context.Context, id string, in repository.UpdateVaccinationInput) (*entity.Vaccination, error) {
	fields := map[string]any{}
	if in.VaccineName != nil {
		fields["vaccineName"] = *in.VaccineName
	}
	if in.VaccinatedAt != nil {
		fields["vaccinatedAt"] = *in.VaccinatedAt
	}
	if in.NextScheduledDate != nil {
		fields["nextScheduledDate"] = *in.NextScheduledDate
	}
	if in.Notes != nil {
		fields["notes"] = *in.Notes
	}
	if len(fields) > 0 {
		if err := r.gdb.WithContext(ctx).Model(&gormVaccination{}).
			Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(ctx, id)
}

func (r *VaccinationRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormVaccination{}).Error
}
