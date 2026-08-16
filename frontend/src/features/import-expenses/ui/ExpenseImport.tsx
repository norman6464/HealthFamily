import { useMemo, useRef, useState } from "react";
import { FileUp, Upload } from "lucide-react";
import { Button, ErrorText } from "@/shared/ui";
import { EXPENSE_CATEGORIES, getExpenseCategoryLabel } from "@/shared/config";
import {
  useImportExpenses,
  type ImportExpense,
  type ImportResult,
} from "../api/useImportExpenses";

interface ExpenseImportProps {
  /** 取込後に無効化する表示中の年 */
  year: number;
}

// マッピング対象の項目
type TargetField = "description" | "category" | "amount" | "expenseDate" | "isDeductible";

interface TargetDef {
  key: TargetField;
  label: string;
  required: boolean;
  // ヘッダ名から自動推定するためのキーワード（部分一致）
  keywords: string[];
}

const TARGET_FIELDS: TargetDef[] = [
  {
    key: "amount",
    label: "金額",
    required: true,
    keywords: ["支払った金額", "金額", "支払金額", "医療費", "費用", "amount"],
  },
  {
    key: "expenseDate",
    label: "支払日",
    required: true,
    keywords: ["支払年月日", "支払日", "日付", "年月日", "date", "日"],
  },
  {
    key: "category",
    label: "医療費の区分",
    required: false,
    keywords: ["区分", "種別", "カテゴリ", "category"],
  },
  {
    key: "description",
    label: "支払先",
    required: false,
    keywords: ["支払先", "病院", "薬局", "支払", "内容", "摘要", "名称"],
  },
  {
    key: "isDeductible",
    label: "控除対象（任意）",
    required: false,
    keywords: ["控除対象", "控除"],
  },
];

// 未割当を表す番兵値
const UNMAPPED = -1;

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

// 既知のカテゴリ値集合（妥当性チェック用）
const VALID_CATEGORIES = new Set<string>(EXPENSE_CATEGORIES.map((c) => c.value));

// 医療費の区分（国税庁フォーム/当アプリエクスポート）→ カテゴリへの逆マッピング
function divisionToCategory(division: string): string {
  const d = division.replace(/\s/g, "");
  if (!d) return "other";
  // 既にカテゴリ値そのものが入っているケース（当アプリのエクスポート等）
  if (VALID_CATEGORIES.has(d)) return d;
  if (/診療|治療|診察/.test(d)) return "hospital";
  if (/医薬品|処方/.test(d)) return "medication";
  if (/薬局/.test(d)) return "pharmacy";
  if (/薬/.test(d)) return "medication";
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

// ヘッダ名からターゲット項目への初期マッピングを推定
function inferMapping(headers: string[]): Record<TargetField, number> {
  const norm = headers.map((h) => h.replace(/\s/g, ""));
  const used = new Set<number>();
  const mapping = {} as Record<TargetField, number>;
  for (const field of TARGET_FIELDS) {
    let found = UNMAPPED;
    for (let i = 0; i < norm.length; i++) {
      if (used.has(i)) continue;
      if (field.keywords.some((k) => norm[i].includes(k))) {
        found = i;
        break;
      }
    }
    if (found !== UNMAPPED) used.add(found);
    mapping[field.key] = found;
  }
  return mapping;
}

interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

function parseCsv(text: string): ParsedCsv {
  const lines = splitCsvRows(text).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.every((c) => c === "")) continue;
    rows.push(cols);
  }
  return { headers, rows };
}

// マッピングを適用して取込行へ変換。不正行はスキップしつつ件数を返す。
function applyMapping(
  csv: ParsedCsv,
  mapping: Record<TargetField, number>,
): { rows: ImportExpense[]; skipped: number } {
  const result: ImportExpense[] = [];
  let skipped = 0;

  const at = (cols: string[], idx: number): string =>
    idx >= 0 ? (cols[idx] ?? "") : "";

  for (const cols of csv.rows) {
    const amount =
      mapping.amount >= 0 ? parseAmount(at(cols, mapping.amount)) : NaN;
    const expenseDate =
      mapping.expenseDate >= 0 ? parseDate(at(cols, mapping.expenseDate)) : "";

    if (!Number.isFinite(amount) || amount <= 0 || !expenseDate) {
      skipped++;
      continue;
    }

    const division = at(cols, mapping.category);
    let category = divisionToCategory(division);
    if (!VALID_CATEGORIES.has(category)) category = "other";

    const payee = at(cols, mapping.description).trim();

    const deductibleRaw = at(cols, mapping.isDeductible);
    const isDeductible =
      mapping.isDeductible >= 0
        ? !/対象外|いいえ|no|false|×|✕/i.test(deductibleRaw)
        : true;

    result.push({
      memberId: null,
      category,
      amount,
      description: payee || undefined,
      expenseDate,
      isDeductible,
    });
  }

  return { rows: result, skipped };
}

// CSVマッピングのプリセット(localStorage)。列順が違うCSVでも再適用できるよう
// 「項目→ヘッダ名」で保存する。
const PRESET_KEY = "hf_csv_mapping_preset";

function loadPreset(): Partial<Record<TargetField, string>> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PRESET_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<TargetField, string>>) : null;
  } catch {
    return null;
  }
}

function savePreset(headers: string[], mapping: Record<TargetField, number>) {
  const preset: Partial<Record<TargetField, string>> = {};
  for (const f of TARGET_FIELDS) {
    const idx = mapping[f.key];
    if (idx >= 0 && headers[idx] != null) preset[f.key] = headers[idx];
  }
  window.localStorage.setItem(PRESET_KEY, JSON.stringify(preset));
}

function applyPreset(
  headers: string[],
  base: Record<TargetField, number>,
): Record<TargetField, number> {
  const preset = loadPreset();
  if (!preset) return base;
  const next = { ...base };
  for (const f of TARGET_FIELDS) {
    const h = preset[f.key];
    if (h != null) {
      const idx = headers.indexOf(h);
      if (idx >= 0) next[f.key] = idx;
    }
  }
  return next;
}

export function ExpenseImport({ year }: ExpenseImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Record<TargetField, number> | null>(null);
  const [parseMessage, setParseMessage] = useState<string>("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [presetSaved, setPresetSaved] = useState(false);

  // 現在のマッピングからプレビュー行を導出
  const preview = useMemo(() => {
    if (!csv || !mapping) return { rows: [] as ImportExpense[], skipped: 0 };
    return applyMapping(csv, mapping);
  }, [csv, mapping]);

  const importMutation = useImportExpenses(year);

  const handleImport = () => {
    if (preview.rows.length === 0) return;
    importMutation.mutate(preview.rows, { onSuccess: setResult });
  };

  const handleFile = async (file: File) => {
    setResult(null);
    setParseMessage("");
    setPresetSaved(false);
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setCsv(null);
        setMapping(null);
        setParseMessage(
          "取込可能な行が見つかりませんでした。ヘッダ行（金額・支払日など）があるCSVを選択してください。",
        );
        return;
      }
      setCsv(parsed);
      // 保存済みプリセットがあれば優先適用、無い項目は自動推定
      setMapping(applyPreset(parsed.headers, inferMapping(parsed.headers)));
    } catch {
      setCsv(null);
      setMapping(null);
      setParseMessage("CSVの読み込みに失敗しました。");
    }
  };

  const updateMapping = (field: TargetField, value: number) => {
    setMapping((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const requiredUnmapped =
    !!mapping &&
    TARGET_FIELDS.some((f) => f.required && mapping[f.key] === UNMAPPED);

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

      {csv && mapping && !result && (
        <div className="space-y-4">
          {/* 列マッピングUI */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-ink-700">列の割り当て</p>
            <p className="text-xs text-ink-500">
              CSVのどの列をどの項目として取り込むか選択してください。
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {TARGET_FIELDS.map((field) => (
                <label key={field.key} className="block space-y-1">
                  <span className="text-xs font-medium text-ink-600">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </span>
                  <select
                    value={mapping[field.key]}
                    onChange={(e) =>
                      updateMapping(field.key, Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-ink-400/30 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value={UNMAPPED}>（未割当）</option>
                    {csv.headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `列${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (csv && mapping) {
                    savePreset(csv.headers, mapping);
                    setPresetSaved(true);
                  }
                }}
                className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-100"
              >
                このマッピングをプリセット保存
              </button>
              {presetSaved && (
                <span className="text-xs text-primary-700">
                  保存しました（次回のCSVに自動適用されます）
                </span>
              )}
            </div>
          </div>

          {requiredUnmapped ? (
            <ErrorText>
              金額・支払日は必須です。割り当てる列を選択してください。
            </ErrorText>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-bold text-primary-700">
                  取込予定 {preview.rows.length}件
                </span>
                {preview.skipped > 0 && (
                  <span className="text-xs text-amber-600">
                    （金額・日付が不正な {preview.skipped}件 はスキップされます）
                  </span>
                )}
              </div>

              {preview.rows.length > 0 && (
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
                      {preview.rows.map((row, i) => (
                        <tr key={i} className="border-t border-ink-400/10">
                          <td className="px-3 py-1.5 text-ink-700">
                            {row.expenseDate}
                          </td>
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
              )}

              <Button
                onClick={handleImport}
                disabled={importMutation.isPending || preview.rows.length === 0}
              >
                <Upload size={16} />
                {importMutation.isPending
                  ? "取込中..."
                  : `${preview.rows.length}件を取り込む`}
              </Button>

              {importMutation.isError && (
                <ErrorText>
                  取込に失敗しました。時間をおいて再度お試しください。
                </ErrorText>
              )}
            </>
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
