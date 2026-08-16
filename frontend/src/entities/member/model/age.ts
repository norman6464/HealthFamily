/** YYYY-MM-DD、または先頭がその形式の ISO 8601 文字列 */
const DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/;

/**
 * 生年月日から満年齢を求める。求められない場合は null。
 *
 * Date のコンストラクタに任せない。理由が2つある。
 *
 * 1. `new Date("2000-08-16")` は UTC として解釈されるため、UTC より西の
 *    地域では getMonth/getDate がローカルの前日を指し、誕生日当日に
 *    1つ若く表示される。
 * 2. Date は存在しない日付を繰り上げる。`new Date("2024-02-30")` は
 *    3月1日になり、入力ミスがそのまま年齢として通ってしまう。
 *
 * そこで年月日を文字列から取り出し、暦日として成立するかを自分で確かめ、
 * 現地時間の数値として比較する。
 *
 * 読めない値と未来日は null。呼び出し側は `age !== null` で表示を分けるので、
 * NaN を返すとその判定を素通りして画面に「NaN歳」と出る。
 * 負の年齢に意味は無く、入力ミスを「-1歳」と見せるより出さない方がよい。
 */
export function getMemberAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;

  const matched = DATE_PREFIX.exec(birthDate);
  if (!matched) return null;

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);

  // 繰り上げが起きていないかで、暦日として成立するかを判定する
  const probe = new Date(year, month - 1, day);
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() - (month - 1);
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) {
    age -= 1;
  }
  return age < 0 ? null : age;
}
