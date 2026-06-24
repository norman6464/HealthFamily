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

// AllergyRepository は "Allergy" テーブルのリポジトリ。
// 検索系(List/FindByID)は sqlc、書き込み系(Create/Update/Delete)は GORM を使う。
type AllergyRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewAllergyRepository(db *database.DB) *AllergyRepository {
	return &AllergyRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func allergyFromSqlc(a sqlcgen.Allergy) entity.Allergy {
	return entity.Allergy{
		ID:           a.ID,
		UserID:       a.UserId,
		MemberID:     a.MemberId,
		AllergenName: a.AllergenName,
		AllergyType:  a.AllergyType,
		Severity:     a.Severity,
		Symptoms:     a.Symptoms,
		DiagnosedAt:  a.DiagnosedAt,
		Notes:        a.Notes,
		CreatedAt:    a.CreatedAt,
	}
}

func (r *AllergyRepository) List(ctx context.Context, userID string) ([]entity.Allergy, error) {
	rows, err := r.q.ListAllergies(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.Allergy, 0, len(rows))
	for _, a := range rows {
		list = append(list, allergyFromSqlc(a))
	}
	return list, nil
}

func (r *AllergyRepository) FindByID(ctx context.Context, id string) (*entity.Allergy, error) {
	a, err := r.q.GetAllergy(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := allergyFromSqlc(a)
	return &e, nil
}

func (r *AllergyRepository) Create(ctx context.Context, in repository.CreateAllergyInput) (*entity.Allergy, error) {
	m := gormAllergy{
		ID:           auth.NewID(),
		UserID:       in.UserID,
		MemberID:     in.MemberID,
		AllergenName: in.AllergenName,
		AllergyType:  in.AllergyType,
		Severity:     in.Severity,
		Symptoms:     in.Symptoms,
		DiagnosedAt:  in.DiagnosedAt,
		Notes:        in.Notes,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *AllergyRepository) Update(ctx context.Context, id string, in repository.UpdateAllergyInput) (*entity.Allergy, error) {
	fields := map[string]any{}
	if in.AllergenName != nil {
		fields["allergenName"] = *in.AllergenName
	}
	if in.AllergyType != nil {
		fields["allergyType"] = *in.AllergyType
	}
	if in.Severity != nil {
		fields["severity"] = *in.Severity
	}
	if in.Symptoms != nil {
		fields["symptoms"] = *in.Symptoms
	}
	if in.DiagnosedAt != nil {
		fields["diagnosedAt"] = *in.DiagnosedAt
	}
	if in.Notes != nil {
		fields["notes"] = *in.Notes
	}
	if len(fields) > 0 {
		if err := r.gdb.WithContext(ctx).Model(&gormAllergy{}).
			Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(ctx, id)
}

func (r *AllergyRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormAllergy{}).Error
}
