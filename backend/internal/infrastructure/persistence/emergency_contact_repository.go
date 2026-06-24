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

// EmergencyContactRepository は "EmergencyContact" テーブルのリポジトリ。
// 検索系(List/FindByID)は sqlc、書き込み系(Create/Update/Delete)は GORM を使う。
type EmergencyContactRepository struct {
	gdb *gorm.DB
	q   *sqlcgen.Queries
}

func NewEmergencyContactRepository(db *database.DB) *EmergencyContactRepository {
	return &EmergencyContactRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool)}
}

func emergencyContactFromSqlc(e sqlcgen.EmergencyContact) entity.EmergencyContact {
	return entity.EmergencyContact{
		ID:           e.ID,
		UserID:       e.UserId,
		MemberID:     e.MemberId,
		ContactName:  e.ContactName,
		PhoneNumber:  e.PhoneNumber,
		Relationship: e.Relationship,
		Notes:        e.Notes,
		CreatedAt:    e.CreatedAt,
	}
}

func (r *EmergencyContactRepository) List(ctx context.Context, userID string) ([]entity.EmergencyContact, error) {
	rows, err := r.q.ListEmergencyContacts(ctx, userID)
	if err != nil {
		return nil, err
	}
	list := make([]entity.EmergencyContact, 0, len(rows))
	for _, e := range rows {
		list = append(list, emergencyContactFromSqlc(e))
	}
	return list, nil
}

func (r *EmergencyContactRepository) FindByID(ctx context.Context, id string) (*entity.EmergencyContact, error) {
	e, err := r.q.GetEmergencyContact(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	ec := emergencyContactFromSqlc(e)
	return &ec, nil
}

func (r *EmergencyContactRepository) Create(ctx context.Context, in repository.CreateEmergencyContactInput) (*entity.EmergencyContact, error) {
	m := gormEmergencyContact{
		ID:           auth.NewID(),
		UserID:       in.UserID,
		MemberID:     in.MemberID,
		ContactName:  in.ContactName,
		PhoneNumber:  in.PhoneNumber,
		Relationship: in.Relationship,
		Notes:        in.Notes,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *EmergencyContactRepository) Update(ctx context.Context, id string, in repository.UpdateEmergencyContactInput) (*entity.EmergencyContact, error) {
	fields := map[string]any{}
	if in.ContactName != nil {
		fields["contactName"] = *in.ContactName
	}
	if in.PhoneNumber != nil {
		fields["phoneNumber"] = *in.PhoneNumber
	}
	if in.Relationship != nil {
		fields["relationship"] = *in.Relationship
	}
	if in.Notes != nil {
		fields["notes"] = *in.Notes
	}
	if len(fields) > 0 {
		if err := r.gdb.WithContext(ctx).Model(&gormEmergencyContact{}).
			Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
			return nil, err
		}
	}
	return r.FindByID(ctx, id)
}

func (r *EmergencyContactRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormEmergencyContact{}).Error
}
