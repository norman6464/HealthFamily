package persistence

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"gorm.io/gorm"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
	"healthfamily/internal/infrastructure/database"
	"healthfamily/internal/infrastructure/sqlc/sqlcgen"
	"healthfamily/internal/pkg/auth"
)

// MemberRepository は "Member" テーブルのリポジトリ。
// 検索系(List/FindByID)は sqlc、書き込み系(Create/Update/Delete)は GORM を使う。
// pool は集計/動的クエリ(ListSummary 等、aggregate_queries.go)で生SQLに利用する。
type MemberRepository struct {
	gdb  *gorm.DB
	q    *sqlcgen.Queries
	pool *pgxpool.Pool
}

func NewMemberRepository(db *database.DB) *MemberRepository {
	return &MemberRepository{gdb: db.Gorm, q: sqlcgen.New(db.Pool), pool: db.Pool}
}

func memberFromSqlc(m sqlcgen.Member) entity.Member {
	return entity.Member{
		ID:         m.ID,
		UserID:     m.UserId,
		MemberType: m.MemberType,
		Name:       m.Name,
		PetType:    m.PetType,
		PhotoURL:   m.PhotoUrl,
		BirthDate:  m.BirthDate,
		Notes:      m.Notes,
		CreatedAt:  m.CreatedAt,
		UpdatedAt:  m.UpdatedAt,
	}
}

func (r *MemberRepository) List(ctx context.Context, userID string) ([]entity.Member, error) {
	rows, err := r.q.ListMembers(ctx, userID)
	if err != nil {
		return nil, err
	}
	members := make([]entity.Member, 0, len(rows))
	for _, m := range rows {
		members = append(members, memberFromSqlc(m))
	}
	return members, nil
}

func (r *MemberRepository) FindByID(ctx context.Context, id string) (*entity.Member, error) {
	m, err := r.q.GetMember(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	e := memberFromSqlc(m)
	return &e, nil
}

func (r *MemberRepository) Create(ctx context.Context, in repository.CreateMemberInput) (*entity.Member, error) {
	m := gormMember{
		ID:         auth.NewID(),
		UserID:     in.UserID,
		MemberType: in.MemberType,
		Name:       in.Name,
		PetType:    in.PetType,
		BirthDate:  in.BirthDate,
		Notes:      in.Notes,
	}
	if err := r.gdb.WithContext(ctx).Create(&m).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, m.ID)
}

func (r *MemberRepository) Update(ctx context.Context, id string, in repository.UpdateMemberInput) (*entity.Member, error) {
	// 旧実装は更新の有無に関わらず updatedAt を常に now() で更新する。
	fields := map[string]any{"updatedAt": gorm.Expr("now()")}
	if in.Name != nil {
		fields["name"] = *in.Name
	}
	if in.PetType != nil {
		fields["petType"] = *in.PetType
	}
	if in.BirthDate != nil {
		fields["birthDate"] = *in.BirthDate
	}
	if in.Notes != nil {
		fields["notes"] = *in.Notes
	}
	if err := r.gdb.WithContext(ctx).Model(&gormMember{}).
		Where(`"id" = ?`, id).Updates(fields).Error; err != nil {
		return nil, err
	}
	return r.FindByID(ctx, id)
}

func (r *MemberRepository) Delete(ctx context.Context, id string) error {
	return r.gdb.WithContext(ctx).Where(`"id" = ?`, id).Delete(&gormMember{}).Error
}
