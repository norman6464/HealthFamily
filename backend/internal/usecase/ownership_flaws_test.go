package usecase

import (
	"context"
	"errors"
	"testing"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// --- テスト用の最小リポジトリ -------------------------------------------------

type stubMemberRepo struct{ members map[string]*entity.Member }

func (r *stubMemberRepo) FindByID(_ context.Context, id string) (*entity.Member, error) {
	return r.members[id], nil
}
func (r *stubMemberRepo) List(context.Context, string) ([]entity.Member, error) { return nil, nil }
func (r *stubMemberRepo) ListSummary(context.Context, string) ([]entity.MemberSummary, error) {
	return nil, nil
}
func (r *stubMemberRepo) Create(context.Context, repository.CreateMemberInput) (*entity.Member, error) {
	return nil, nil
}
func (r *stubMemberRepo) Update(context.Context, string, repository.UpdateMemberInput) (*entity.Member, error) {
	return nil, nil
}
func (r *stubMemberRepo) Delete(context.Context, string) error { return nil }

var _ repository.MemberRepository = (*stubMemberRepo)(nil)

type stubHospitalRepo struct{ hospitals map[string]*entity.Hospital }

func (r *stubHospitalRepo) FindByID(_ context.Context, id string) (*entity.Hospital, error) {
	return r.hospitals[id], nil
}
func (r *stubHospitalRepo) List(context.Context, string) ([]entity.Hospital, error) { return nil, nil }
func (r *stubHospitalRepo) Create(context.Context, repository.CreateHospitalInput) (*entity.Hospital, error) {
	return nil, nil
}
func (r *stubHospitalRepo) Update(context.Context, string, repository.UpdateHospitalInput) (*entity.Hospital, error) {
	return nil, nil
}
func (r *stubHospitalRepo) Delete(context.Context, string) error { return nil }

var _ repository.HospitalRepository = (*stubHospitalRepo)(nil)

func isForbidden(err error) bool {
	var f *domain.ForbiddenError
	return errors.As(err, &f)
}

func isNotFound(err error) bool {
	var n *domain.NotFoundError
	return errors.As(err, &n)
}

// --- 1) appointments の hospitalId ------------------------------------------

// 他人の病院IDを自分の通院記録に紐付けられてはならない。
// ID を推測できれば、他人の病院データを自分の画面に引き込める。
func TestEnsureHospitalOwner_他人の病院IDは拒否する(t *testing.T) {
	hospitals := &stubHospitalRepo{hospitals: map[string]*entity.Hospital{
		"h-other": {ID: "h-other", UserID: "user-2", Name: "他人の病院"},
	}}
	id := "h-other"

	err := ensureHospitalOwner(context.Background(), hospitals, "user-1", &id)

	if err == nil {
		t.Fatal("他人の病院IDが通ってしまった")
	}
	if !isForbidden(err) {
		t.Fatalf("ForbiddenError を期待したが %T (%v)", err, err)
	}
}

func TestEnsureHospitalOwner_存在しない病院IDは拒否する(t *testing.T) {
	hospitals := &stubHospitalRepo{hospitals: map[string]*entity.Hospital{}}
	id := "missing"

	err := ensureHospitalOwner(context.Background(), hospitals, "user-1", &id)

	if err == nil || !isNotFound(err) {
		t.Fatalf("NotFoundError を期待したが %v", err)
	}
}

func TestEnsureHospitalOwner_自分の病院IDは通す(t *testing.T) {
	hospitals := &stubHospitalRepo{hospitals: map[string]*entity.Hospital{
		"h-own": {ID: "h-own", UserID: "user-1", Name: "かかりつけ"},
	}}
	id := "h-own"

	if err := ensureHospitalOwner(context.Background(), hospitals, "user-1", &id); err != nil {
		t.Fatalf("自分の病院が拒否された: %v", err)
	}
}

func TestEnsureHospitalOwner_未指定なら何もしない(t *testing.T) {
	hospitals := &stubHospitalRepo{hospitals: map[string]*entity.Hospital{}}

	if err := ensureHospitalOwner(context.Background(), hospitals, "user-1", nil); err != nil {
		t.Fatalf("未指定は許容すべき: %v", err)
	}
	empty := ""
	if err := ensureHospitalOwner(context.Background(), hospitals, "user-1", &empty); err != nil {
		t.Fatalf("空文字も未指定として許容すべき: %v", err)
	}
}

// --- 2) medications の reorder ----------------------------------------------

type reorderMedRepo struct {
	meds     map[string]*entity.Medication
	reorders [][]string
}

func (r *reorderMedRepo) FindByID(_ context.Context, id string) (*entity.Medication, error) {
	return r.meds[id], nil
}
func (r *reorderMedRepo) ListByUser(context.Context, string) ([]entity.Medication, error) {
	return nil, nil
}
func (r *reorderMedRepo) ListByMember(context.Context, string) ([]entity.Medication, error) {
	return nil, nil
}
func (r *reorderMedRepo) ListAlerts(context.Context, string) ([]entity.Medication, error) {
	return nil, nil
}
func (r *reorderMedRepo) Create(context.Context, repository.CreateMedicationInput) (*entity.Medication, error) {
	return nil, nil
}
func (r *reorderMedRepo) Update(context.Context, string, repository.UpdateMedicationInput) (*entity.Medication, error) {
	return nil, nil
}
func (r *reorderMedRepo) UpdateStock(context.Context, string, int) (*entity.Medication, error) {
	return nil, nil
}
func (r *reorderMedRepo) Delete(context.Context, string) error { return nil }
func (r *reorderMedRepo) Reorder(_ context.Context, _ string, ids []string) error {
	r.reorders = append(r.reorders, ids)
	return nil
}

var _ repository.MedicationRepository = (*reorderMedRepo)(nil)

// 他人の薬IDを混ぜた並び替えは、黙って無視せず拒否する。
// 無視すると「通った」と誤認され、IDの当たり判定にも使われうる。
func TestReorder_他人の薬IDが混ざっていたら拒否する(t *testing.T) {
	repo := &reorderMedRepo{meds: map[string]*entity.Medication{
		"m-own":   {ID: "m-own", UserID: "user-1"},
		"m-other": {ID: "m-other", UserID: "user-2"},
	}}
	uc := NewMedicationUsecase(repo, &stubMemberRepo{})

	err := uc.Reorder(context.Background(), "user-1", []string{"m-own", "m-other"})

	if err == nil {
		t.Fatal("他人のIDが混ざっていても成功してしまった")
	}
	if !isForbidden(err) {
		t.Fatalf("ForbiddenError を期待したが %T (%v)", err, err)
	}
	if len(repo.reorders) != 0 {
		t.Fatal("拒否したのに並び替えを実行してはならない")
	}
}

func TestReorder_存在しないIDは拒否する(t *testing.T) {
	repo := &reorderMedRepo{meds: map[string]*entity.Medication{
		"m-own": {ID: "m-own", UserID: "user-1"},
	}}
	uc := NewMedicationUsecase(repo, &stubMemberRepo{})

	err := uc.Reorder(context.Background(), "user-1", []string{"m-own", "missing"})

	if err == nil || !isNotFound(err) {
		t.Fatalf("NotFoundError を期待したが %v", err)
	}
	if len(repo.reorders) != 0 {
		t.Fatal("拒否したのに並び替えを実行してはならない")
	}
}

func TestReorder_すべて自分の薬なら通す(t *testing.T) {
	repo := &reorderMedRepo{meds: map[string]*entity.Medication{
		"m-1": {ID: "m-1", UserID: "user-1"},
		"m-2": {ID: "m-2", UserID: "user-1"},
	}}
	uc := NewMedicationUsecase(repo, &stubMemberRepo{})

	if err := uc.Reorder(context.Background(), "user-1", []string{"m-2", "m-1"}); err != nil {
		t.Fatalf("自分の薬だけなのに拒否された: %v", err)
	}
	if len(repo.reorders) != 1 {
		t.Fatal("並び替えが実行されていない")
	}
}

func TestReorder_同じIDの重複は拒否する(t *testing.T) {
	repo := &reorderMedRepo{meds: map[string]*entity.Medication{
		"m-1": {ID: "m-1", UserID: "user-1"},
	}}
	uc := NewMedicationUsecase(repo, &stubMemberRepo{})

	err := uc.Reorder(context.Background(), "user-1", []string{"m-1", "m-1"})

	if err == nil {
		t.Fatal("重複は並び順が定まらないので拒否すべき")
	}
	if len(repo.reorders) != 0 {
		t.Fatal("拒否したのに並び替えを実行してはならない")
	}
}
