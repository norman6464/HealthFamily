export interface BodyMeasurementView {
  id: string;
  memberId: string;
  memberName?: string;
  weight?: number;
  height?: number;
  recordedAt: string;
  notes?: string;
}

// 計測記録の部分更新に使う入力。カード内の編集 UI (entities) と更新 feature の双方が
// 参照するため、依存が上向きにならないよう entities 側に置く。
// 値を消す操作を表現するため null を許容する。
export interface UpdateBodyMeasurementInput {
  weight?: number | null;
  height?: number | null;
  notes?: string | null;
}
