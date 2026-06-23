import { useRef, useState } from "react";
import { Loader2, ImageUp, Info } from "lucide-react";
import { Button, ErrorText } from "@/components/ui";

interface OcrImportProps {
  onPick: (text: string) => void;
}

export function OcrImport({ onPick }: OcrImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 同じファイルを再選択できるよう値をリセット
    e.target.value = "";
    if (!file) return;

    setError(null);
    setLines([]);
    setProgress(0);
    setLoading(true);

    try {
      // tesseract.js は重いため遅延読込する
      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker("jpn+eng", undefined, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      try {
        const { data } = await worker.recognize(file);
        const text = data.text ?? "";
        const parsed = text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        setLines(parsed);
        if (parsed.length === 0) {
          setError("文字を読み取れませんでした。別の画像でお試しください。");
        }
      } finally {
        await worker.terminate();
      }
    } catch {
      setError("画像の解析に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-primary-200 bg-primary-50/40 p-3">
      <div className="flex items-start gap-2 text-xs text-ink-500">
        <Info size={14} className="mt-0.5 flex-shrink-0" />
        <span>
          簡易OCRのため精度は限定的です。読み取った文字は必ず内容をご確認ください。
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      <Button
        type="button"
        variant="ghost"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            解析中…{progress > 0 ? ` ${progress}%` : ""}
          </>
        ) : (
          <>
            <ImageUp size={16} />
            画像を選択
          </>
        )}
      </Button>

      <ErrorText>{error}</ErrorText>

      {lines.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-ink-700">読み取り結果（行を選んで薬名に使えます）</p>
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            {lines.map((line, i) => (
              <li
                key={`${i}-${line}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2"
              >
                <span className="min-w-0 flex-1 break-all text-sm text-ink-800">{line}</span>
                <button
                  type="button"
                  onClick={() => onPick(line)}
                  className="flex-shrink-0 rounded-lg bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-200"
                >
                  これを薬名に使う
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
