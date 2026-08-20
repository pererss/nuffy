import { AdminShell } from "@/components/admin/admin-nav";
import { SettingsForm } from "@/components/admin/settings-form";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("settings")
    .select("key, value")
    .in("key", ["system", "marketplace", "economy"]);

  const get = (key: string) => {
    const row = (rows ?? []).find((r) => r.key === key);
    return (row?.value ?? {}) as Record<string, unknown>;
  };

  const system = get("system");
  const marketplace = get("marketplace");
  const economy = get("economy");

  return (
    <AdminShell title="Настройки">
      <SettingsForm
        initial={{
          system: {
            sell_lock_days: Number(system.sell_lock_days ?? 7),
            shop_enabled: system.shop_enabled !== false,
            marketplace_enabled: system.marketplace_enabled !== false,
            trades_enabled: system.trades_enabled !== false,
            upgrades_enabled: system.upgrades_enabled !== false,
          },
          marketplace: { fee_percent: Number(marketplace.fee_percent ?? 0) },
          economy: { upgrade_source_multiplier: Number(economy.upgrade_source_multiplier ?? 0.9) },
        }}
      />
    </AdminShell>
  );
}
