import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileUp, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { Button, ErrorText } from "@/components/ui";
import { getExpenseCategoryLabel } from "@/lib/categories";

interface ImportExpense {
  memberId: string | null;
  category: string;
  amount: number;
  description?: string;
  expenseDate: string;
  isDeductible?: boolean;
}

interface ImportResult {
  imported: number;
  skipped: number;
}

interface ExpenseImportProps {
  onImported: () => void;
}

// CSV の1行を簡易パース（ダブルクォート/エスケープ対応, カンマ区切り）
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result.map((c) => c.trim());
}

// CSV全体を行に分割（クォート内の改行も許容）
function splitCsvRows(text: string): string[] {
  const rows: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        cur += ch;
      }
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      if (cur.length > 0) rows.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0) rows.push(cur);
  return rows;
}

// 医療費の区分（国税庁フォーム/当アプリエクスポート）→ カテゴリへの逆マッピング
function divisionToCategory(division: string): string {
  const d = division.replace(/\s/g, "");
  if (!d) return "other";
  if (/診療|治療|診察/.test(d)) return "hospital";
  if (/医薬品|薬局|薬|処方/.test(d)) return "medication";
  if (/介護/.test(d)) return "other";
  if (/その他/.test(d)) return "other";
  if (/保険/.test(d)) return "insurance";
  if (/健診|検査|検診/.test(d)) return "checkup";
  if (/通院|交通/.test(d)) return "transport";
  if (/ペット/.test(d)) return "pet";
  return "other";
}

// 金額文字列から数値を抽出（カンマ/円記号/全角を除去）
function parseAmount(raw: string): number {
  const normalized = raw
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/[,，\s¥￥円]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

// 支払日を YYYY-MM-DD に正規化
function parseDate(raw: string): string {
  const t = raw
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .trim();
  // 2024-01-02 / 2024/1/2 / 2024.1.2 / 20240102 / 2024年1月2日
  let m = t.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!m) m = t.match(/(\d{4})(\d{2})(\d{2})/);
  if (!m) return "";
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// ヘッダ名から列インデックスを探す（部分一致）
function findCol(headers: string[], keywords: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].replace(/\s/g, "");
    if (keywords.some((k) => h.includes(k))) return i;
  }
  return -1;
}

function parseCsv(text: string): { rows: ImportExpense[]; errors: number } {
  const lines = splitCsvRows(text).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], errors: 0 };

  const headers = parseCsvLine(lines[0]);
  const personIdx = findCol(headers, ["医療を受けた人", "受けた人", "氏名", "名前", "人"]);
  const payeeIdx = findCol(headers, ["支払先", "病院", "薬局", "支払", "内容", "摘要"]);
  const divisionIdx = findCol(headers, ["区分", "種別", "カテゴリ"]);
  const amountIdx = findCol(headers, ["支払った金額", "金額", "支払金額"]);
  const dateIdx = findCol(headers, ["支払年月日", "支払日", "日付", "年月日", "日"]);
  const deductibleIdx = findCol(headers, ["控除対象", "控除"]);

  const rows: ImportExpense[] = [];
  let errors = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.every((c) => c === "")) continue;

    const amount = amountIdx >= 0 ? parseAmount(cols[amountIdx] ?? "") : NaN;
    const expenseDate = dateIdx >= 0 ? parseDate(cols[dateIdx] ?? "") : "";

    if (!Number.isFinite(amount) || amount <= 0 || !expenseDate) {
      errors++;
      continue;
    }

    const division = divisionIdx >= 0 ? (cols[divisionIdx] ?? "") : "";
    const payee = payeeIdx >= 0 ? (cols[payeeIdx] ?? "").trim() : "";
    const deductibleRaw = deductibleIdx >= 0 ? (cols[deductibleIdx] ?? "") : "";
    const isDeductible = deductibleIdx >= 0 ? !/対象外|いいえ|no|false|×|✕/i.test(deductibleRaw) : true;

    rows.push({
      memberId: null,
      category: divisionToCategory(division),
      amount,
      description: payee || undefined,
      expenseDate,
      isDeductible,
    });
  }

  return { rows, errors };
}

export function ExpenseImport({ onImported }: ExpenseImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [parsed, setParsed] = useState<ImportExpense[]>([]);
  const [parseErrors, setParseErrors] = useState(0);
  const [parseMessage, setParseMessage] = useState<string>("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const importMutation = useMutation({
    mutationFn: (expenses: ImportExpense[]) =>
      api.post<ImportResult>("/expenses/import", { expenses }),
    onSuccess: (res) => {
      setResult(res);
      onImported();
    },
  });

  const handleFile = async (file: File) => {
    setResult(null);
    setParseMessage("");
    setFileName(file.name);
    try {
      const text = await file.text();
      const { rows, errors } = parseCsv(text);
      setParsed(rows);
      setParseErrors(errors);
      if (rows.length === 0) {
        setParseMessage(
          "取込可能な行が見つかりませんでした。ヘッダ行（金額・支払日など）があるCSVを選択してください。",
        );
      }
    } catch {
      setParsed([]);
      setParseErrors(0);
      setParseMessage("CSVの読み込みに失敗しました。");
    }
  };

  const handleImport = () => {
    if (parsed.length === 0) return;
    importMutation.mutate(parsed);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-bold text-ink-800">医療費CSVの取込</p>
        <p className="text-xs text-ink-500">
          マイナポータルの医療費通知や国税庁「医療費集計フォーム」、当アプリの明細書CSVを取り込めます。
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
          <FileUp size={16} />
          CSVファイルを選択
        </Button>
        {fileName && <span className="text-xs text-ink-500">{fileName}</span>}
      </div>

      <ErrorText>{parseMessage}</ErrorText>

      {parsed.length > 0 && !result && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-bold text-primary-700">
              取込予定 {parsed.length}件
            </span>
            {parseErrors > 0 && (
              <span className="text-xs text-amber-600">
                （金額・日付が不正な {parseErrors}件 はスキップされます）
              </span>
            )}
          </div>

          <div className="max-h-64 overflow-auto rounded-xl border border-ink-400/15">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-primary-50 text-ink-600">
                <tr>
                  <th className="px-3 py-2 font-medium">支払日</th>
                  <th className="px-3 py-2 font-medium">区分</th>
                  <th className="px-3 py-2 font-medium">支払先</th>
                  <th className="px-3 py-2 text-right font-medium">金額</th>
                  <th className="px-3 py-2 font-medium">控除</th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((row, i) => (
                  <tr key={i} className="border-t border-ink-400/10">
                    <td className="px-3 py-1.5 text-ink-700">{row.expenseDate}</td>
                    <td className="px-3 py-1.5 text-ink-700">
                      {getExpenseCategoryLabel(row.category)}
                    </td>
                    <td className="px-3 py-1.5 text-ink-600">
                      {row.description ?? "-"}
                    </td>
                    <td className="px-3 py-1.5 text-right text-ink-800">
                      {row.amount.toLocaleString()}円
                    </td>
                    <td className="px-3 py-1.5 text-ink-600">
                      {row.isDeductible ? "対象" : "対象外"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button onClick={handleImport} disabled={importMutation.isPending}>
            <Upload size={16} />
            {importMutation.isPending ? "取込中..." : `${parsed.length}件を取り込む`}
          </Button>

          {importMutation.isError && (
            <ErrorText>取込に失敗しました。時間をおいて再度お試しください。</ErrorText>
          )}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm">
          <p className="font-bold text-primary-700">取込が完了しました</p>
          <p className="mt-1 text-ink-700">
            登録 {result.imported}件
            {result.skipped > 0 && ` / スキップ ${result.skipped}件`}
          </p>
        </div>
      )}
    </div>
  );
}
