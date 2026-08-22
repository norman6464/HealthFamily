import { queryKeys, useResource } from "@/shared/api";
import type { Hospital } from "@/shared/api";
import type { UpdateHospitalInput } from "@/entities/hospital";

export interface HospitalFormData {
  name: string;
  address?: string;
  phone?: string;
  department?: string;
  doctorName?: string;
  notes?: string;
}

/**
 * 病院の作成・更新・削除。
 *
 * 一覧取得と無効化の組み立ては useResource に任せる。
 * 手で書くと、エンドポイントの綴りと無効化するキーの対応を
 * リソースの数だけ繰り返すことになり、片方だけ直し忘れる形で壊れる。
 */
function useHospitalResource() {
  return useResource<Hospital, HospitalFormData, UpdateHospitalInput>({
    queryKey: queryKeys.hospitals.all,
    listPath: "/hospitals",
    basePath: "/hospitals",
  });
}

export function useCreateHospital() {
  return useHospitalResource().create;
}

export function useUpdateHospital() {
  return useHospitalResource().update;
}

export function useDeleteHospital() {
  return useHospitalResource().remove;
}
