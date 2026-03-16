/** 日付を「YYYY年M月D日」形式にフォーマットする */
export const formatDateJP = (date: Date): string => {
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
};

/** 日付を「YYYY/M/D」形式にフォーマットする */
export const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString('ja-JP');
};
