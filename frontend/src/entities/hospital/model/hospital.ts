// 病院の部分更新に使う入力。カード内の編集 UI (entities) と更新 feature の双方が
// 参照するため、依存が上向きにならないよう entities 側に置く。
export interface UpdateHospitalInput {
  name?: string;
  address?: string;
  phone?: string;
  department?: string;
  doctorName?: string;
  notes?: string;
}
