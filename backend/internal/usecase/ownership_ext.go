package usecase

import (
	"context"

	"healthfamily/internal/domain"
	"healthfamily/internal/domain/repository"
)

// ensureMemberOwner は指定メンバーが userID の所有であることを確認する共通ヘルパー
func ensureMemberOwner(ctx context.Context, members repository.MemberRepository, userID, memberID string) error {
	m, err := members.FindByID(ctx, memberID)
	if err != nil {
		return err
	}
	if m == nil {
		return domain.NewNotFound("メンバー")
	}
	if m.UserID != userID {
		return domain.NewForbidden("このメンバーにアクセスする権限がありません")
	}
	return nil
}

// ensureHospitalOwner は病院IDが呼び出しユーザーのものかを確認する。
//
// 通院記録は hospitalId で病院を参照する。ここを確認しないと、他人の病院IDを
// 推測して自分の記録に紐付けられ、その病院の情報を自分の画面へ引き込めてしまう。
// 未指定(nil / 空文字)は「病院を紐付けない」の意味なので許容する。
func ensureHospitalOwner(ctx context.Context, hospitals repository.HospitalRepository, userID string, hospitalID *string) error {
	if hospitalID == nil || *hospitalID == "" {
		return nil
	}
	h, err := hospitals.FindByID(ctx, *hospitalID)
	if err != nil {
		return err
	}
	if h == nil {
		return domain.NewNotFound("病院")
	}
	if h.UserID != userID {
		return domain.NewForbidden("この病院にアクセスする権限がありません")
	}
	return nil
}
