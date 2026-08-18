"use client";

import { useRef, useState } from "react";
import { ImagePlus, Upload, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { adminUploadImage } from "@/lib/actions/admin";

export type CropData = { x: number; y: number; zoom: number };

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read_failed"));
    r.readAsDataURL(file);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load_failed"));
    img.src = src;
  });
}

/**
 * Square crop editor for chip/collection/pack images.
 * crop = { x, y, zoom }, where x/y is the focus point in % (matches ChipImage
 * object-position) and zoom = scale multiplier.
 */
export function CropImage({
  bucket,
  folder,
  value,
  crop: initialCrop,
  onChange,
}: {
  bucket: "chips" | "collections" | "packs";
  folder: string;
  value?: string | null;
  crop?: CropData | null;
  onChange: (c: { url: string; crop: CropData }) => void;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [state, setState] = useState({ sx: 0, sy: 0 });
  const [zoom, setZoom] = useState(initialCrop?.zoom ?? 1);
  const [uploading, setUploading] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);

  const C = 280;

  const pick = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast("Нужен файл изображения", "error");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast("Файл слишком большой (макс. 8 МБ)", "error");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(f);
      const img = await loadImage(dataUrl);
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setState({ sx: 0, sy: 0 });
      setZoom(Math.min(4, Math.max(1, 1)));
      setSrc(dataUrl);
      setLoadingImg(false);
    } catch {
      toast("Не удалось загрузить изображение", "error");
    }
  };

  const vw = natural.w / Math.max(1, zoom);
  const vh = natural.h / Math.max(1, zoom);
  const extraX = Math.max(0, natural.w - vw);
  const extraY = Math.max(0, natural.h - vh);

  const clamp = (v: number, max: number) => Math.min(Math.max(0, v), max);

  const drag = useRef<{ px: number; py: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { px: e.clientX, py: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dxSrc = ((e.clientX - drag.current.px) * vw) / C;
    const dySrc = ((e.clientY - drag.current.py) * vh) / C;
    drag.current = { px: e.clientX, py: e.clientY };
    setState((s) => ({ sx: clamp(s.sx + dxSrc, extraX), sy: clamp(s.sy + dySrc, extraY) }));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const onZoom = (z: number) => {
    const next = Math.min(4, Math.max(1, z));
    const centerX = state.sx + vw / 2;
    const centerY = state.sy + vh / 2;
    const nvw = natural.w / next;
    const nvh = natural.h / next;
    setZoom(next);
    setState({
      sx: clamp(centerX - nvw / 2, Math.max(0, natural.w - nvw)),
      sy: clamp(centerY - nvh / 2, Math.max(0, natural.h - nvh)),
    });
  };

  const save = async () => {
    if (!src) {
      toast("Сначала загрузите изображение", "warning");
      return;
    }
    setUploading(true);
    try {
      const img = await loadImage(src);
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no_ctx");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, state.sx, state.sy, vw, vh, 0, 0, 512, 512);
      const blob: Blob | null = await new Promise((res) =>
        canvas.toBlob(res, "image/png")
      );
      if (!blob) throw new Error("no_blob");
      const file = new File([blob], "chip.png", { type: "image/png" });
      const res = await adminUploadImage(bucket, folder, file);
      if (!res.ok) {
        toast(res.error ?? "Ошибка загрузки", "error");
        return;
      }
      const x = extraX > 0 ? state.sx / extraX : 0.5;
      const y = extraY > 0 ? state.sy / extraY : 0.5;
      onChange({ url: res.data!.url, crop: { x, y, zoom } });
      toast("Изображение сохранено", "success");
    } catch {
      toast("Не удалось сохранить изображение", "error");
    }
    setUploading(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      <div
        className="relative w-[280px] cursor-move touch-none select-none overflow-hidden rounded-xl border border-panel-border bg-canvas-inset"
        style={{ height: C }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {src ? (
          <img
            src={src}
            alt="crop"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition: `${extraX > 0 ? (state.sx / extraX) * 100 : 50}% ${extraY > 0 ? (state.sy / extraY) * 100 : 50}%`,
              transform: `scale(${zoom})`,
              transformOrigin: "center",
            }}
            onDragStart={(e) => e.preventDefault()}
          />
        ) : (
          <button
            type="button"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-dim transition-colors hover:text-ink-faint"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-8 w-8" />
            <span className="text-[12px]">Добавить изображение</span>
          </button>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
      </div>

      <div className="flex w-[280px] items-center gap-2">
        <ZoomIn className="h-4 w-4 text-ink-dim" />
        <input
          type="range"
          min={1}
          max={4}
          step={0.05}
          value={zoom}
          onChange={(e) => onZoom(parseFloat(e.target.value))}
          className="flex-1"
          disabled={!src}
        />
        <span className="w-10 text-right text-[11px] tabular text-ink-faint">
          {zoom.toFixed(2)}×
        </span>
      </div>

      <div className="flex w-[280px] gap-2">
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          Выбрать файл
        </Button>
        <Button variant="primary" size="sm" loading={uploading} disabled={!src} onClick={save}>
          Сохранить
        </Button>
        {value && (
          <img src={value} alt="current" className="h-9 w-9 rounded-lg border border-panel-border object-cover" />
        )}
      </div>
      {loadingImg && <p className="text-[11px] text-ink-faint">Загрузка…</p>}
    </div>
  );
}
