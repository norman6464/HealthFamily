import { Navigate, useParams } from "react-router";

/**
 * メンバー詳細はお薬管理画面を兼ねるため、お薬管理へリダイレクトする。
 */
export default function MemberDetail() {
  const { memberId } = useParams();
  return <Navigate to={`/members/${memberId}/medications`} replace />;
}
