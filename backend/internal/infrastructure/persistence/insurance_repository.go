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

// InsuranceRepository は "Insurance" テーブルのリポジトリ。
// 検索系(List/FindByID)は sqlc、書き込み系(Create/Update/Delete)は GORM を使う。
type InsuranceRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewInsuranceRepository(db *database.DB) *InsuranceRepository {
	return &InsuranceRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func insuranceFromSqlc(i sqlcgen.Insurance) entity.Insurance {
	return entity.Insurance{
		ID:            i.ID,
		UserID:        i.UserId,
		MemberID:      i.MemberId,
		InsuranceType: i.InsuranceType,
		ProviderName:  i.ProviderName,
		PolicyNumber:  i.PolicyNumber,
		Notes:         i.Notes,
		CreatedAt:     i.CreatedAt,
	}
}

func (r *InsuranceRepository) List(ctx context.Context, userID string) ([]entity.Insurance, error) {
	rows, err := r.q.ListInsurances(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.Insurance, 0, len(rows))
	for _, i := range rows {
		list = append(list, insuranceFromSqlc(i))
	}
	return list, nil
}

func (r *InsuranceRepository) FindByID(ctx context.Context, id string) (*entity.Insurance, error) {
	i, err := r.q.GetInsurance(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := insuranceFromSqlc(i)
	return &e, nil
}

func (r *InsuranceRepository) Create(ctx context.Context, in repository.CreateInsuranceInput) (*entity.Insurance, error) {
	m := gormInsurance{
		ID:            auth.NewID(),
		UserID:        in.UserID,
		MemberID:      in.MemberID,
		InsuranceType: in.InsuranceType,
		ProviderName:  in.ProviderName,
		PolicyNumber:  in.PolicyNumber,
		Notes:         in.Notes,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *InsuranceRepository) Update(ctx context.Context, id string, in repository.UpdateInsuranceInput) (*entity.Insurance, error) {
	fields := map[string]any{}
	if in.InsuranceType != nil {
		fields["insuranceType"] = *in.InsuranceType
	}
	if in.ProviderName != nil {
		fields["providerName"] = *in.ProviderName
	}
	if in.PolicyNumber != nil {
		fields["policyNumber"] = *in.PolicyNumber
	}
	if in.Notes != nil {
		fields["notes"] = *in.Notes
	}
	if len(fields) > 0 {
		if err := r.gdb.WithContext(ctx).Model(&gormInsurance{}).
			Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(ctx, id)
}

func (r *InsuranceRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormInsurance{}).Error
}
