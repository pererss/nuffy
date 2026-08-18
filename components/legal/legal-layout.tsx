import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/misc";

export function LegalLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="mx-auto max-w-[720px]">
        <div className="legal-page">{children}</div>
      </div>
    </>
  );
}