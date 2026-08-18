export function cn(...classes: Array<string | null | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const priceFmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dateShortFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function fmtPrice(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${priceFmt.format(n)} ₽`;
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return dateFmt.format(new Date(iso));
}

export function fmtDateShort(iso: string | null | undefined) {
  if (!iso) return "—";
  return dateShortFmt.format(new Date(iso));
}

export function fmtAccountId(accountId: number | string | null | undefined) {
  if (accountId === null || accountId === undefined || accountId === "") return "—";
  return `#${String(accountId).padStart(6, "0")}`;
}

export function fmtNumber(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return priceFmt.format(n);
}

export function fmtSeconds(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} д.`);
  if (h > 0 || d > 0) parts.push(`${h} ч.`);
  parts.push(`${m} мин.`);
  if (parts.length > 1) parts.splice(1, 1);
  return `${d > 0 ? `${d} д. ` : ""}${h > 0 ? `${h} ч. ` : ""}${m} мин.`;
}

export function fmtRemaining(isoUntil: string | null) {
  if (!isoUntil) return "—";
  const ms = new Date(isoUntil).getTime() - Date.now();
  if (ms <= 0) return "0 мин.";
  return fmtSeconds(ms / 1000);
}

export function rarityColor(slug: string) {
  switch (slug) {
    case "legendary":
      return "#F5C651";
    case "epic":
      return "#A97CF8";
    case "rare":
      return "#4FB3F0";
    case "uncommon":
      return "#47D38C";
    default:
      return "#A8AFBB";
  }
}

export function rarityLabel(slug: string) {
  switch (slug) {
    case "legendary":
      return "Legendary";
    case "epic":
      return "Epic";
    case "rare":
      return "Rare";
    case "uncommon":
      return "Uncommon";
    default:
      return "Common";
  }
}

export type LockInfo = {
  locked: boolean;
  remainingText: string;
  remainingMs: number;
};

export function lockInfo(lockedUntil: string | null): LockInfo {
  if (!lockedUntil) return { locked: false, remainingText: "", remainingMs: 0 };
  const ms = new Date(lockedUntil).getTime() - Date.now();
  if (ms <= 0) return { locked: false, remainingText: "", remainingMs: 0 };
  return { locked: true, remainingText: fmtSeconds(ms / 1000), remainingMs: ms };
}

export type SellCheck = {
  allowed: boolean;
  reason?: "lock" | "collection" | "listed";
  remainingText?: string;
};

/** UI-side mirror of the server sell check (the server is authoritative). */
export function sellCheck(item: {
  locked_until: string | null;
  collection_total: number;
  collection_sold: number;
  status: string;
}): SellCheck {
  if (item.status === "listed") return { allowed: false, reason: "listed" };
  const lock = lockInfo(item.locked_until);
  if (lock.locked) {
    return { allowed: false, reason: "lock", remainingText: lock.remainingText };
  }
  if (item.collection_sold < item.collection_total) {
    return { allowed: false, reason: "collection" };
  }
  return { allowed: true };
}

export function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Неизвестная ошибка";
}

export function formatRarityWeight(slug: string) {
  switch (slug) {
    case "legendary":
      return "Легендарная";
    case "epic":
      return "Эпическая";
    case "rare":
      return "Редкая";
    case "uncommon":
      return "Необычная";
    default:
      return "Обычная";
  }
}