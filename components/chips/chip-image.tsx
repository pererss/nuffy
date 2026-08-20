"use client";

import { useRef, useState } from "react";
import { cn, rarityColor } from "@/lib/utils";

type Crop = { x: number; y: number; zoom: number };

export function ChipImage({
  name,
  imageUrl,
  crop,
  rarity,
  size = 96,
  className,
  ring = true,
  interactive = true,
}: {
  name: string;
  imageUrl?: string | null;
  crop?: Crop | null;
  rarity: string;
  size?: number;
  className?: string;
  ring?: boolean;
  interactive?: boolean;
}) {
  const color = rarityColor(rarity);
  const cropObj = crop ?? { x: 0.5, y: 0.5, zoom: 1 };
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    px: number;
    py: number;
    rx: number;
    ry: number;
    moved: boolean;
  } | null>(null);
  const movedRef = useRef(false);

  const onDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    drag.current = {
      px: e.clientX,
      py: e.clientY,
      rx: rot.x,
      ry: rot.y,
      moved: false,
    };
    movedRef.current = false;
    setDragging(true);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      drag.current.moved = true;
      movedRef.current = true;
    }
    const ry = Math.max(-42, Math.min(42, drag.current.ry + dx * 0.5));
    const rx = Math.max(-30, Math.min(30, drag.current.rx - dy * 0.5));
    setRot({ x: rx, y: ry });
  };

  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
  };

  const onClick = (e: React.MouseEvent) => {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  };

  const hasImage = Boolean(imageUrl);

  return (
    <span
      className={cn(
        "relative inline-block select-none",
        interactive && "cursor-grab active:cursor-grabbing",
        className
      )}
      style={{ width: size, height: size, perspective: "820px" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onClick={onClick}
    >
      <span
        className="relative block h-full w-full overflow-hidden rounded-full"
        style={{
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          transformStyle: "preserve-3d",
          transition: dragging ? "none" : "transform 0.45s cubic-bezier(.2,.8,.2,1)",
          boxShadow: ring
            ? `0 0 0 1.5px ${color}55, 0 0 16px -2px ${color}33, inset 0 0 0 1.5px rgba(255,255,255,0.08), 0 8px 20px -8px rgba(0,0,0,0.5)`
            : "0 8px 20px -10px rgba(0,0,0,0.5)",
        }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl ?? undefined}
            alt={name}
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover"
            style={{
              objectPosition: `${cropObj.x * 100}% ${cropObj.y * 100}%`,
              transform: `scale(${Math.max(1, cropObj.zoom)})`,
            }}
          />
        ) : (
          <span
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "linear-gradient(150deg, rgb(var(--surface-2)), rgb(var(--bg)))" }}
          >
            <span
              className="text-[12px] font-bold uppercase tracking-wider"
              style={{ color }}
            >
              {name.slice(0, 2)}
            </span>
          </span>
        )}

        {/* Gloss overlay */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(120% 120% at ${50 - rot.y * 0.7}% ${
              38 - rot.x * 0.7
            }%, rgba(255,255,255,0.18), transparent 46%)`,
          }}
        />
        {/* Inner shadow for depth */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            boxShadow:
              "inset 0 -10px 20px rgba(0,0,0,0.35), inset 0 2px 8px rgba(255,255,255,0.06)",
          }}
        />
      </span>
    </span>
  );
}