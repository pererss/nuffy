import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { NotConfigured } from "@/components/layout/not-configured";
import { isSupabaseConfigured, createSupabase } from "@/lib/supabase/server";
import { fmtAccountId } from "@/lib/utils";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NUFFY — marketplace коллекционных фишек",
  description:
    "Магазин, торговая площадка и обмен цифровых коллекционных фишек.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isSupabaseConfigured())) {
    return (
      <html lang="ru" className={`${manrope.variable} ${sora.variable}`}>
        <body className="min-h-screen">
          <NotConfigured />
        </body>
      </html>
    );
  }

  const supabase = await createSupabase();
  const { data: session } = await supabase.auth.getSession();
  let user: {
    id: string;
    username: string;
    accountId: string;
    balance: number;
    role: string;
    isAdmin: boolean;
  } | null = null;

  if (session.session?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, account_id, balance, role")
      .eq("id", session.session.user.id)
      .single();

    if (profile) {
      user = {
        id: profile.id,
        username: profile.username,
        accountId: fmtAccountId(profile.account_id),
        balance: profile.balance,
        role: profile.role,
        isAdmin: profile.role === "admin",
      };
    }
  }

  return (
    <html lang="ru" className={`${manrope.variable} ${sora.variable}`}>
      <body className="flex min-h-screen flex-col">
        <ToastProvider>
          <Header user={user} />
          <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16 pt-6 sm:px-6">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}