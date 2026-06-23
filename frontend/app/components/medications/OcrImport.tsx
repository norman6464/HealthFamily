import { useEffect, useRef, useState } from "react";
import { Loader2, ImageUp, Info, Crop, Sliders } from "lucide-react";
import { Button, ErrorText } from "@/components/ui";

interface OcrImportProps {
  onPick: (text: string) => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// 表示用キャンバスの最大幅（縮小して扱いやすくする）
const MAX_PREVIEW_WIDTH = 360;
// 二値化のしきい値（0-255）
const BINARY_THRESHOLD = 140;
// コントラスト強調係数
const CONTRAST = 1.4;

export function OcrImport({ onPick }: OcrImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  // 元画像（原寸）を保持しておき、OCR時に再描画する
  const imageRef = useRef<HTMLImageElement | null>(null);
  // ドラッグ開始座標（プレビュー座標系）
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);

  const [hasImage, setHasImage] = useState(false);
  const [preprocess, setPreprocess] = useState(true);
  // プレビュー座標系での選択矩形（null = 全体）
  const [selection, setSelection] = useState<Rect | null>(null);
  // 現在ドラッグ中の矩形（描画用）
  const [dragRect, setDragRect] = useState<Rect | null>(null);

  // プレビューを再描画（前処理ON/OFFの反映）
  useEffect(() => {
    drawPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasImage, preprocess]);

  const applyPreprocess = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      // グレースケール化（輝度）
      const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      // コントラスト強調（中央128基準）
      let v = (gray - 128) * CONTRAST + 128;
      // 簡易二値化
      v = v >= BINARY_THRESHOLD ? 255 : 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const drawPreview = () => {
    const img = imageRef.current;
    const canvas = previewCanvasRef.current;
    if (!img || !canvas) return;

    const scale = Math.min(1, MAX_PREVIEW_WIDTH / img.naturalWidth);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    if (preprocess) applyPreprocess(ctx, w, h);
  };

  const loadImage = (file: File) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("image load failed"));
      };
      img.src = url;
    });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 同じファイルを再選択できるよう値をリセット
    e.target.value = "";
    if (!file) return;

    setError(null);
    setLines([]);
    setProgress(0);
    setSelection(null);
    setDragRect(null);

    try {
      const img = await loadImage(file);
      imageRef.current = img;
      setHasImage(true);
      // hasImage 変更で useEffect により drawPreview が走る
    } catch {
      setError("画像の読み込みに失敗しました。別の画像でお試しください。");
    }
  };

  // プレビュー座標を取得（マウス/タッチ共通の pointer events）
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return {
      x: Math.max(0, Math.min(canvas.width, x)),
      y: Math.max(0, Math.min(canvas.height, y)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!hasImage || loading) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = getCanvasPoint(e);
    dragStartRef.current = p;
    setDragRect({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const start = dragStartRef.current;
    if (!start) return;
    const p = getCanvasPoint(e);
    setDragRect({
      x: Math.min(start.x, p.x),
      y: Math.min(start.y, p.y),
      w: Math.abs(p.x - start.x),
      h: Math.abs(p.y - start.y),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!start || !dragRect) {
      setDragRect(null);
      return;
    }
    // 小さすぎる選択は無効（全体扱い）
    if (dragRect.w >= 8 && dragRect.h >= 8) {
      setSelection(dragRect);
    } else {
      setSelection(null);
    }
    setDragRect(null);
  };

  const resetSelection = () => {
    setSelection(null);
    setDragRect(null);
  };

  // OCR対象のキャンバスを原寸ベースで生成し dataURL を返す
  const buildOcrDataUrl = (): string | null => {
    const img = imageRef.current;
    const preview = previewCanvasRef.current;
    if (!img || !preview) return null;

    // プレビュー座標 → 原寸座標へ変換
    const ratioX = img.naturalWidth / preview.width;
    const ratioY = img.naturalHeight / preview.height;

    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    if (selection) {
      sx = Math.round(selection.x * ratioX);
      sy = Math.round(selection.y * ratioY);
      sw = Math.round(selection.w * ratioX);
      sh = Math.round(selection.h * ratioY);
    }
    sw = Math.max(1, sw);
    sh = Math.max(1, sh);

    const out = document.createElement("canvas");
    out.width = sw;
    out.height = sh;
    const ctx = out.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    if (preprocess) applyPreprocess(ctx, sw, sh);
    return out.toDataURL("image/png");
  };

  const runOcr = async () => {
    if (!hasImage) return;
    setError(null);
    setLines([]);
    setProgress(0);
    setLoading(true);

    try {
      const dataUrl = buildOcrDataUrl();
      if (!dataUrl) {
        setError("画像の準備に失敗しました。もう一度お試しください。");
        return;
      }

      // tesseract.js は重いため遅延読込する
      const Tesseract = await import("tesseract.js");
      // 言語データは自前ホスティング(public/tessdata)から読み込む(外部CDN非依存)
      const worker = await Tesseract.createWorker("jpn+eng", undefined, {
        langPath: "/tessdata",
        gzip: true,
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      try {
        const { data } = await worker.recognize(dataUrl);
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

  // 描画する矩形（ドラッグ中優先、なければ確定選択）
  const overlay = dragRect ?? selection;

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
        <ImageUp size={16} />
        {hasImage ? "別の画像を選択" : "画像を選択"}
      </Button>

      {hasImage && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPreprocess((v) => !v)}
              disabled={loading}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                preprocess
                  ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                  : "bg-white text-ink-600 hover:bg-ink-50"
              }`}
            >
              <Sliders size={14} />
              前処理 {preprocess ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={resetSelection}
              disabled={loading || !selection}
              className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-50"
            >
              <Crop size={14} />
              選択範囲をリセット
            </button>
          </div>

          <p className="text-xs text-ink-500">
            画像上をドラッグして読み取り範囲を選択できます（未選択時は全体を対象）。
          </p>

          <div className="relative inline-block max-w-full overflow-hidden rounded-lg border border-ink-200 bg-white">
            <canvas
              ref={previewCanvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="block max-w-full touch-none cursor-crosshair select-none"
            />
            {overlay && overlay.w > 0 && overlay.h > 0 && previewCanvasRef.current && (
              <div
                className="pointer-events-none absolute border-2 border-primary-500 bg-primary-500/10"
                style={{
                  left: `${(overlay.x / previewCanvasRef.current.width) * 100}%`,
                  top: `${(overlay.y / previewCanvasRef.current.height) * 100}%`,
                  width: `${(overlay.w / previewCanvasRef.current.width) * 100}%`,
                  height: `${(overlay.h / previewCanvasRef.current.height) * 100}%`,
                }}
              />
            )}
          </div>

          <Button
            type="button"
            onClick={runOcr}
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
                この内容で読み取る
              </>
            )}
          </Button>
        </div>
      )}

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
