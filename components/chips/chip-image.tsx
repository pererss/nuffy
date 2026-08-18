"use client";

import { cn } from "@/lib/utils";
import { rarityColor } from "@/lib/utils";

function hashHue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) % 360;
  }
  return h;
}

/**
 * The chip — the main visual object of NUFFY.
 * Renders a round chip with a rarity ring. When image_url is set,
 * the image is cropped/positioned via image_crop {x, y, zoom}.
 */
export function ChipImage({
  name,
  imageUrl,
  crop,
  rarity,
  hue,
  size = 96,
  className,
  ring = true,
}: {
  name: string;
  imageUrl?: string | null;
  crop?: { x: number; y: number; zoom: number } | null;
  rarity: string;
  hue?: number;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const h = hue ?? hashHue(name);
  const color = rarityColor(rarity);
  const hasImage = Boolean(imageUrl);
  const cropObj = crop ?? { x: 0.5, y: 0.5, zoom: 1 };

  return (
    <span
      className={cn("chip-glow relative inline-block select-none overflow-hidden", className)}
      style={{
        width: size,
        height: size,
        ["--rarity" as string]: color,
        ...(ring
          ? {
              boxShadow: `0 0 0 2px ${color}8c, 0 0 18px -2px ${color}50, inset 0 0 0 2px rgba(255,255,255,0.05)`,
            }
          : {}),
      }}
    >
      {hasImage ? (
        <img
          src={imageUrl ?? undefined}
          alt={name}
          loading="lazy"
          className="absolute inset-0 h-full w-full select-none object-cover"
          draggable={false}
          style={{
            objectPosition: `${cropObj.x * 100}% ${cropObj.y * 100}%`,
            transform: `scale(${Math.max(1, cropObj.zoom)})`,
          }}
        />
      ) : (
        <span
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 32% 28%, hsl(${h} 62% 42%), hsl(${(h + 45) % 360} 70% 26%) 72%)`,
          }}
        >
          <span
            className="absolute left-1/4 top-1/5 h-2/5 w-2/5 rounded-full opacity-30 blur-[6px]"
            style={{ background: `hsl(${h} 90% 70%)` }}
          />
        </span>
      )}
      <span
        className="pointer-events-none absolute inset-[6%] rounded-full"
        style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.10), inset 0 -10px 24px rgba(0,0,0,0.35)" }}
      />
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.35)" }}
      />
    </span>
  );
}