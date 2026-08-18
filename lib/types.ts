export type Rarity = {
  id: string;
  slug: string;
  name: string;
  color: string;
  sort_order: number;
};

export type Level = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  color: string;
  multiplier: number;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  total_minted: number;
  sold_count: number;
  released_at: string | null;
  status: "draft" | "pending" | "active" | "sold_out" | "archived";
  created_at: string;
};

export type Chip = {
  id: string;
  collection_id: string;
  name: string;
  image_url: string | null;
  image_crop: { x: number; y: number; zoom: number };
  rarity_id: string;
  level_id: string;
  base_price: number;
  number: number;
  total_minted: number;
  sold_count: number;
  status: "draft" | "active" | "disabled";
  created_at: string;
};

export type ChipWithMeta = Chip & {
  collection: Pick<Collection, "id" | "name" | "slug" | "status">;
  rarity: Pick<Rarity, "id" | "slug" | "name" | "color" | "sort_order">;
  level: Pick<Level, "id" | "name" | "slug" | "sort_order" | "color">;
};

export type InventoryRow = {
  id: string;
  chip_id: string;
  serial: number;
  owner_id: string;
  status: "owned" | "listed" | "traded" | "upgraded" | "removed" | "sold";
  acquired_at: string;
  acquired_via: string;
  locked_until: string | null;
  chip_name: string;
  chip_number: number;
  image_url: string | null;
  image_crop: { x: number; y: number; zoom: number } | null;
  base_price: number;
  collection_id: string;
  collection_name: string;
  collection_slug: string;
  collection_total: number;
  collection_sold: number;
  collection_status: Collection["status"];
  rarity_slug: string;
  rarity_name: string;
  rarity_color: string;
  rarity_order: number;
  level_name: string;
  level_slug: string;
  level_order: number;
};

export type Listing = {
  id: string;
  instance_id: string;
  seller_id: string;
  price: number;
  status: "listed" | "sold" | "cancelled";
  listed_at: string;
  sold_at: string | null;
  instance: Pick<InventoryRow, "chip_id" | "serial"> & {
    chip: {
      id: string;
      name: string;
      number: number;
      image_url: string | null;
      image_crop: Chip["image_crop"];
      base_price: number;
      rarity: Pick<Rarity, "slug" | "name" | "color" | "sort_order">;
      level: Pick<Level, "name" | "slug" | "sort_order">;
      collection: Pick<Collection, "id" | "name" | "slug" | "total_minted" | "sold_count">;
    };
  };
};

export type ProfilePublic = {
  user_id: string;
  account_id: number;
  username: string;
  avatar_url: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  account_id: number;
  username: string;
  balance: number;
  role: "user" | "admin";
  avatar_url: string | null;
  is_banned: boolean;
  banned_at: string | null;
  created_at: string;
};

export type Pack = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  status: "draft" | "active" | "paused" | "ended";
  available_count: number | null;
  opened_count: number;
  starts_at: string | null;
  ends_at: string | null;
  current_version: number;
};

export type PackVersion = {
  id: string;
  pack_id: string;
  version: number;
  config: {
    tiers: Array<{
      tier_id: number;
      name?: string;
      rarity_id: string;
      level_id?: string | null;
      weight: number;
    }>;
  };
  created_at: string;
};

export type PackItem = {
  id: string;
  pack_version_id: string;
  tier_id: number;
  chip_id: string;
  weight: number;
};

export type Trade = {
  id: string;
  code: string;
  initiator_id: string;
  partner_id: string | null;
  status: "pending" | "completed" | "cancelled";
  wants: string[];
  created_at: string;
  completed_at: string | null;
  expires_at: string;
};

export type TradeItem = {
  id: string;
  trade_id: string;
  instance_id: string;
  giver_id: string;
};

export type Purchase = {
  id: string;
  instance_id: string;
  listing_id: string | null;
  chip_id: string;
  buyer_id: string;
  seller_id: string | null;
  amount: number;
  fee: number;
  type: "shop" | "marketplace";
  created_at: string;
};

export type BalanceTransaction = {
  id: number;
  user_id: string;
  type:
    | "deposit"
    | "withdraw"
    | "purchase"
    | "sale"
    | "pack"
    | "upgrade"
    | "promo"
    | "admin_grant"
    | "admin_remove"
    | "refund"
    | "trade"
    | "marketplace_buy";
  amount: number;
  balance_before: number;
  balance_after: number;
  status: "pending" | "completed" | "rejected" | "cancelled";
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  admin_id: string | null;
  created_at: string;
};

export type PromoCode = {
  id: string;
  code: string;
  bonus_type: "percent" | "fixed";
  bonus_value: number;
  max_uses: number;
  per_user_limit: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  used_count: number;
  created_at: string;
};

export type InstanceEvent = {
  id: number;
  instance_id: string;
  event: string;
  actor_user_id: string | null;
  from_user_id: string | null;
  to_user_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export type Upgrade = {
  id: string;
  user_id: string;
  source_instance_id: string;
  target_chip_id: string;
  balance_spent: number;
  chance: number;
  created_at: string;
};

export type UpgradeAttempt = {
  id: string;
  upgrade_id: string;
  success: boolean;
  result_instance_id: string | null;
  rolled_at: string;
};

export type AdminAuditLog = {
  id: number;
  admin_id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
};

export type SellStatus = {
  allowed: boolean;
  reason?: string;
  remaining_seconds?: number;
  listing_id?: string;
};

export type UpgradeResult = {
  upgrade_id: string;
  success: boolean;
  chance: number;
  result_instance_id: string | null;
};