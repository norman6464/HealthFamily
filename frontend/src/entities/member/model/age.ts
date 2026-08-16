/**
 * 生年月日から満年齢を求める。求められない場合は null。
 *
 * 日付として読めない値で NaN を返してはいけない。呼び出し側は
 * `age !== null` で表示を分けるため、NaN はその判定を素通りして
 * 画面に「NaN歳」と出る。実際にメンバー一覧でそうなっていた。
 *
 * 未来の日付も null にする。負の年齢に意味は無く、
 * 入力ミスを「-1歳」と表示するより出さない方がよい。
 */
export function getMemberAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age < 0 ? null : age;
}
