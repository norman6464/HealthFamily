import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import type { Member } from "@/lib/types";
import { Button, Card, ErrorText, Input } from "@/components/ui";

export default function Members() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [memberType, setMemberType] = useState<"human" | "pet">("human");
  const [error, setError] = useState<string | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => api.get<Member[]>("/members"),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post<Member>("/members", { name, memberType }),
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/members/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-800">メンバー</h1>

      <Card>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setMemberType("human")}
              className={`flex-1 rounded-xl py-2 text-sm ${memberType === "human" ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}
            >
              家族
            </button>
            <button
              onClick={() => setMemberType("pet")}
              className={`flex-1 rounded-xl py-2 text-sm ${memberType === "pet" ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}
            >
              ペット
            </button>
          </div>
          <Input placeholder="名前" value={name} onChange={(e) => setName(e.target.value)} />
          <ErrorText>{error}</ErrorText>
          <Button
            onClick={() => name.trim() && createMutation.mutate()}
            disabled={createMutation.isPending}
            className="w-full"
          >
            <UserPlus className="mr-2 h-4 w-4" /> 追加する
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm text-slate-400">読み込み中...</p>
      ) : (
        <div className="space-y-2">
          {members?.map((m) => (
            <Card key={m.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{m.name}</p>
                <p className="text-xs text-slate-500">
                  {m.memberType === "pet" ? "ペット" : "家族"}
                </p>
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
