"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { adminCancelListing } from "@/lib/actions/admin";

export function CancelListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const cancel = async () => {
    setBusy(true);
    const res = await adminCancelListing(listingId);
    setBusy(false);
    if (res.ok) {
      toast("Объявление отменено", "success");
      router.refresh();
    } else {
      toast(res.error ?? "Ошибка", "error");
    }
  };

  return (
    <Button variant="danger" size="sm" loading={busy} onClick={cancel}>
      <Ban className="h-3.5 w-3.5" />
      Отменить
    </Button>
  );
}
