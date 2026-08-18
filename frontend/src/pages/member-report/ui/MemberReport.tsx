import { useAppointments } from "@/entities/appointment";
import { useExaminations } from "@/entities/examination";
import { useVaccinations } from "@/entities/vaccination";
import { useMemberMedications } from "@/entities/medication";
import { getMemberAge, useMember } from "@/entities/member";
import { ALLERGY_SEVERITY_LABELS, useAllergies } from "@/entities/allergy";
import { Link, useParams } from "react-router";
import { ChevronLeft, Printer } from "lucide-react";
import { useRequireAuth } from "@/features/auth";
import { LoadingSpinner } from "@/shared/ui";

const memberTypeLabels: Record<string, string> = {
  human: "家族",
  pet: "ペット",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function calcAge(birthDate: string | null): string {
  const age = getMemberAge(birthDate);
  return age === null ? "-" : `${age}歳`;
}

export default function MemberReport() {
  const { memberId } = useParams();
  const { user, loading: authLoading } = useRequireAuth();

  const { data: member, isLoading: memberLoading } = useMember(memberId);

  const { data: medications = [], isLoading: medsLoading } = useMemberMedications(memberId);

  const { data: allergies = [] } = useAllergies({ enabled: !!user });

  const { data: vaccinations = [] } = useVaccinations({ enabled: !!user });

  const { data: examinations = [] } = useExaminations({ enabled: !!user });

  const { data: appointments = [] } = useAppointments({ enabled: !!user });

  if (authLoading || (user && (memberLoading || medsLoading))) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-ink-600">メンバーが見つかりませんでした。</p>
          <Link to="/members" className="text-primary hover:underline">
            メンバー一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  const memberAllergies = allergies.filter((a) => a.memberId === member.id);
  const memberVaccinations = [...vaccinations]
    .filter((v) => v.memberId === member.id)
    .sort(
      (a, b) =>
        new Date(b.vaccinatedAt).getTime() - new Date(a.vaccinatedAt).getTime(),
    );
  const memberExaminations = [...examinations]
    .filter((e) => e.memberId === member.id)
    .sort(
      (a, b) =>
        new Date(b.examinedAt).getTime() - new Date(a.examinedAt).getTime(),
    );
  const memberAppointments = [...appointments]
    .filter((a) => a.memberId === member.id)
    .sort(
      (a, b) =>
        new Date(b.appointmentDate).getTime() -
        new Date(a.appointmentDate).getTime(),
    )
    .slice(0, 5);
  const activeMedications = medications.filter((m) => m.isActive);

  const typeLabel = memberTypeLabels[member.memberType] ?? member.memberType;

  return (
    <div className="min-h-screen bg-white text-ink-800">
      <style>{`@media print { .print\\:hidden { display:none !important } @page { margin: 16mm } }`}</style>

      <div className="mx-auto max-w-3xl p-6 print:p-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            to={`/members/${member.id}`}
            className="inline-flex items-center space-x-1 text-sm text-ink-500 hover:text-ink-700 transition-colors"
          >
            <ChevronLeft size={16} />
            <span>戻る</span>
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-white text-sm rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Printer size={16} />
            <span>印刷 / PDF保存</span>
          </button>
        </div>

        <header className="border-b border-ink-400/20 pb-4 mb-6">
          <h1 className="text-2xl font-bold">医師共有用サマリー</h1>
          <p className="text-sm text-ink-500 mt-1">
            作成日: {formatDate(new Date().toISOString())}
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-base font-bold border-l-4 border-primary pl-2 mb-3">
            基本情報
          </h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex">
              <dt className="w-24 text-ink-500">氏名</dt>
              <dd className="font-medium">{member.name}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-ink-500">種別</dt>
              <dd className="font-medium">
                {typeLabel}
                {member.petType ? `（${member.petType}）` : ""}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-ink-500">生年月日</dt>
              <dd className="font-medium">{formatDate(member.birthDate)}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-ink-500">年齢</dt>
              <dd className="font-medium">{calcAge(member.birthDate)}</dd>
            </div>
          </dl>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold border-l-4 border-primary pl-2 mb-3">
            服用中の薬
          </h2>
          {activeMedications.length === 0 ? (
            <p className="text-sm text-ink-500">服用中の薬はありません。</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-ink-400/20 text-left text-ink-500">
                  <th className="py-1.5 pr-3 font-medium">薬の名前</th>
                  <th className="py-1.5 pr-3 font-medium">用量</th>
                  <th className="py-1.5 font-medium">頻度</th>
                </tr>
              </thead>
              <tbody>
                {activeMedications.map((m) => (
                  <tr key={m.id} className="border-b border-ink-400/10">
                    <td className="py-1.5 pr-3">{m.name}</td>
                    <td className="py-1.5 pr-3">{m.dosageAmount ?? "-"}</td>
                    <td className="py-1.5">{m.frequency ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold border-l-4 border-primary pl-2 mb-3">
            アレルギー
          </h2>
          {memberAllergies.length === 0 ? (
            <p className="text-sm text-ink-500">登録されているアレルギーはありません。</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {memberAllergies.map((a) => (
                <li key={a.id} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{a.allergenName}</span>
                  <span className="text-ink-500">
                    （{ALLERGY_SEVERITY_LABELS[a.severity] ?? a.severity}）
                  </span>
                  {a.symptoms ? (
                    <span className="text-ink-500">{a.symptoms}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold border-l-4 border-primary pl-2 mb-3">
            予防接種歴
          </h2>
          {memberVaccinations.length === 0 ? (
            <p className="text-sm text-ink-500">予防接種の記録はありません。</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {memberVaccinations.map((v) => (
                <li key={v.id} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-ink-500 w-32 shrink-0">
                    {formatDate(v.vaccinatedAt)}
                  </span>
                  <span className="font-medium">{v.vaccineName}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold border-l-4 border-primary pl-2 mb-3">
            検査歴
          </h2>
          {memberExaminations.length === 0 ? (
            <p className="text-sm text-ink-500">検査の記録はありません。</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {memberExaminations.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-ink-500 w-32 shrink-0">
                    {formatDate(e.examinedAt)}
                  </span>
                  <span className="font-medium">{e.examinationType}</span>
                  {e.notes ? (
                    <span className="text-ink-500">{e.notes}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold border-l-4 border-primary pl-2 mb-3">
            直近の通院
          </h2>
          {memberAppointments.length === 0 ? (
            <p className="text-sm text-ink-500">通院の記録はありません。</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {memberAppointments.map((a) => (
                <li key={a.id} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-ink-500 w-32 shrink-0">
                    {formatDate(a.appointmentDate)}
                  </span>
                  <span className="font-medium">
                    {a.appointmentType ?? "通院"}
                  </span>
                  {a.description ? (
                    <span className="text-ink-500">{a.description}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="border-t border-ink-400/20 pt-3 mt-8 text-xs text-ink-400">
          <p>本サマリーは HealthFamily で作成されました。</p>
        </footer>
      </div>
    </div>
  );
}
