import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pill, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Medication, Member } from "@/lib/types";
import { Button, Card, ErrorText, Input } from "@/components/ui";

export default function Medications() {
  const qc = useQueryClient();
  const [memberId, setMemberId] = useState("");
  const [name, setName] = useState("");
  const [dosageAmount, setDosageAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: () => api.get<Member[]>("/members"),
  });

  const { data: medications, isLoading } = useQuery({
    queryKey: ["medications"],
    queryFn: () => api.get<Medication[]>("/medications"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<Medication>("/medications", {
        memberId,
        name,
        dosageAmount: dosageAmount || undefined,
      }),
    onSuccess: () => {
      setName("");
      setDosageAmount("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["medications"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/medications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medications"] }),
  });

  const memberName = (id: string) => members?.find((m) => m.id === id)?.name ?? "";

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-800">おくすり</h1>

      <Card>
        <div className="space-y-3">
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">メンバーを選択</option>
            {members?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <Input placeholder="薬の名前" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="用量（例: 1錠）"
            value={dosageAmount}
            onChange={(e) => setDosageAmount(e.target.value)}
          />
          <ErrorText>{error}</ErrorText>
          <Button
            onClick={() => memberId && name.trim() && createMutation.mutate()}
            disabled={createMutation.isPending}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" /> 追加する
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm text-slate-400">読み込み中...</p>
      ) : (
        <div className="space-y-2">
          {medications?.map((m) => (
            <Card key={m.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Pill className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-slate-800">{m.name}</p>
                  <p className="text-xs text-slate-500">
                    {memberName(m.memberId)}
                    {m.dosageAmount ? `・${m.dosageAmount}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteMutation.mutate(m.id)}
                className="text-slate-300 hover:text-red-500"
                aria-label="削除"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
