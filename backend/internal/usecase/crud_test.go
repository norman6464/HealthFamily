package usecase

import (
	"context"
	"errors"
	"testing"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/entity"
	"healthfamily/internal/domain/repository"
)

// --- テスト用エンティティ・入力 ---

type testEntity struct {
	ID     string
	UserID string
}

type testCreateInput struct {
	UserID   string
	MemberID string
}

type testUpdateInput struct {
	Name *string
}

// --- fake ScopedRepo（メモリ実装） ---

type fakeScopedRepo struct {
	items       map[string]*testEntity
	createCalls int
	deleteCalls int
}

func newFakeScopedRepo() *fakeScopedRepo {
	return &fakeScopedRepo{items: map[string]*testEntity{}}
}

func (r *fakeScopedRepo) List(ctx context.Context, userID string) ([]testEntity, error) {
	var out []testEntity
	for _, e := range r.items {
		if e.UserID == userID {
			out = append(out, *e)
		}
	}
	return out, nil
}

func (r *fakeScopedRepo) FindByID(ctx context.Context, id string) (*testEntity, error) {
	e, ok := r.items[id]
	if !ok {
		return nil, nil
	}
	cp := *e
	return &cp, nil
}

func (r *fakeScopedRepo) Create(ctx context.Context, in testCreateInput) (*testEntity, error) {
	r.createCalls++
	e := &testEntity{ID: "created", UserID: in.UserID}
	r.items[e.ID] = e
	return e, nil
}

func (r *fakeScopedRepo) Update(ctx context.Context, id string, in testUpdateInput) (*testEntity, error) {
	e := r.items[id]
	cp := *e
	return &cp, nil
}

func (r *fakeScopedRepo) Delete(ctx context.Context, id string) error {
	r.deleteCalls++
	delete(r.items, id)
	return nil
}

// --- fake MemberRepository ---

type fakeMemberRepo struct {
	members map[string]*entity.Member
}

func newFakeMemberRepo() *fakeMemberRepo {
	return &fakeMemberRepo{members: map[string]*entity.Member{}}
}

func (r *fakeMemberRepo) List(ctx context.Context, userID string) ([]entity.Member, error) {
	return nil, nil
}
func (r *fakeMemberRepo) ListSummary(ctx context.Context, userID string) ([]entity.MemberSummary, error) {
	return nil, nil
}
func (r *fakeMemberRepo) FindByID(ctx context.Context, id string) (*entity.Member, error) {
	m, ok := r.members[id]
	if !ok {
		return nil, nil
	}
	cp := *m
	return &cp, nil
}
func (r *fakeMemberRepo) Create(ctx context.Context, in repository.CreateMemberInput) (*entity.Member, error) {
	return nil, nil
}
func (r *fakeMemberRepo) Update(ctx context.Context, id string, in repository.UpdateMemberInput) (*entity.Member, error) {
	return nil, nil
}
func (r *fakeMemberRepo) Delete(ctx context.Context, id string) error { return nil }

// --- ヘルパー ---

const (
	testNotFoundName = "テストリソース"
	testForbiddenMsg = "このテストリソースにアクセスする権限がありません"
)

func newTestCRUD(repo *fakeScopedRepo, members *fakeMemberRepo) *MemberScopedCRUD[testEntity, testCreateInput, testUpdateInput] {
	return NewMemberScopedCRUD[testEntity, testCreateInput, testUpdateInput](
		repo, members,
		testNotFoundName, testForbiddenMsg,
		func(e *testEntity) string { return e.UserID },
		func(c testCreateInput) string { return c.UserID },
		func(c testCreateInput) string { return c.MemberID },
	)
}

func TestMemberScopedCRUD_Get_NotFound(t *testing.T) {
	uc := newTestCRUD(newFakeScopedRepo(), newFakeMemberRepo())
	_, err := uc.Get(context.Background(), "user1", "missing")
	var nf *domain.NotFoundError
	if !errors.As(err, &nf) {
		t.Fatalf("NotFoundError を期待したが %T (%v)", err, err)
	}
	if want := testNotFoundName + "が見つかりません"; nf.Message != want {
		t.Fatalf("メッセージ不一致: want %q got %q", want, nf.Message)
	}
}

func TestMemberScopedCRUD_Get_Forbidden(t *testing.T) {
	repo := newFakeScopedRepo()
	repo.items["e1"] = &testEntity{ID: "e1", UserID: "owner"}
	uc := newTestCRUD(repo, newFakeMemberRepo())
	_, err := uc.Get(context.Background(), "intruder", "e1")
	var fb *domain.ForbiddenError
	if !errors.As(err, &fb) {
		t.Fatalf("ForbiddenError を期待したが %T (%v)", err, err)
	}
	if fb.Message != testForbiddenMsg {
		t.Fatalf("メッセージ不一致: want %q got %q", testForbiddenMsg, fb.Message)
	}
}

func TestMemberScopedCRUD_Get_Success(t *testing.T) {
	repo := newFakeScopedRepo()
	repo.items["e1"] = &testEntity{ID: "e1", UserID: "owner"}
	uc := newTestCRUD(repo, newFakeMemberRepo())
	got, err := uc.Get(context.Background(), "owner", "e1")
	if err != nil {
		t.Fatalf("予期しないエラー: %v", err)
	}
	if got == nil || got.ID != "e1" {
		t.Fatalf("エンティティが取得できていない: %+v", got)
	}
}

func TestMemberScopedCRUD_Update_Forbidden(t *testing.T) {
	repo := newFakeScopedRepo()
	repo.items["e1"] = &testEntity{ID: "e1", UserID: "owner"}
	uc := newTestCRUD(repo, newFakeMemberRepo())
	_, err := uc.Update(context.Background(), "intruder", "e1", testUpdateInput{})
	var fb *domain.ForbiddenError
	if !errors.As(err, &fb) {
		t.Fatalf("ForbiddenError を期待したが %T (%v)", err, err)
	}
}

func TestMemberScopedCRUD_Update_Success(t *testing.T) {
	repo := newFakeScopedRepo()
	repo.items["e1"] = &testEntity{ID: "e1", UserID: "owner"}
	uc := newTestCRUD(repo, newFakeMemberRepo())
	got, err := uc.Update(context.Background(), "owner", "e1", testUpdateInput{})
	if err != nil {
		t.Fatalf("予期しないエラー: %v", err)
	}
	if got == nil || got.ID != "e1" {
		t.Fatalf("更新結果が不正: %+v", got)
	}
}

func TestMemberScopedCRUD_Delete_NotFound(t *testing.T) {
	repo := newFakeScopedRepo()
	uc := newTestCRUD(repo, newFakeMemberRepo())
	err := uc.Delete(context.Background(), "user1", "missing")
	var nf *domain.NotFoundError
	if !errors.As(err, &nf) {
		t.Fatalf("NotFoundError を期待したが %T (%v)", err, err)
	}
	if repo.deleteCalls != 0 {
		t.Fatalf("Delete は呼ばれてはいけない")
	}
}

func TestMemberScopedCRUD_Delete_Success(t *testing.T) {
	repo := newFakeScopedRepo()
	repo.items["e1"] = &testEntity{ID: "e1", UserID: "owner"}
	uc := newTestCRUD(repo, newFakeMemberRepo())
	if err := uc.Delete(context.Background(), "owner", "e1"); err != nil {
		t.Fatalf("予期しないエラー: %v", err)
	}
	if repo.deleteCalls != 1 {
		t.Fatalf("Delete が1回呼ばれるべき: got %d", repo.deleteCalls)
	}
}

func TestMemberScopedCRUD_Create_Forbidden(t *testing.T) {
	repo := newFakeScopedRepo()
	members := newFakeMemberRepo()
	members.members["m1"] = &entity.Member{ID: "m1", UserID: "other"}
	uc := newTestCRUD(repo, members)
	_, err := uc.Create(context.Background(), testCreateInput{UserID: "user1", MemberID: "m1"})
	var fb *domain.ForbiddenError
	if !errors.As(err, &fb) {
		t.Fatalf("ForbiddenError を期待したが %T (%v)", err, err)
	}
	if repo.createCalls != 0 {
		t.Fatalf("メンバー非所有時は Create を呼んではいけない")
	}
}

func TestMemberScopedCRUD_Create_Success(t *testing.T) {
	repo := newFakeScopedRepo()
	members := newFakeMemberRepo()
	members.members["m1"] = &entity.Member{ID: "m1", UserID: "user1"}
	uc := newTestCRUD(repo, members)
	got, err := uc.Create(context.Background(), testCreateInput{UserID: "user1", MemberID: "m1"})
	if err != nil {
		t.Fatalf("予期しないエラー: %v", err)
	}
	if got == nil || repo.createCalls != 1 {
		t.Fatalf("Create が呼ばれていない: got=%+v calls=%d", got, repo.createCalls)
	}
}
