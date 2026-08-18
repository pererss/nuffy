import type { Metadata } from "next";
import { Manrope, Montserrat } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/theme";
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

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NUFFY — marketplace коллекционных фишек",
  description:
    "Магазин, торговая площадка и обмен цифровых коллекционных фишек.",
};

const themeScript = `(function(){try{var t=localStorage.getItem('nuffy-theme');if(t!=='light'&&t!=='dark'){t='light';}var d=document.documentElement;if(t==='dark'){d.classList.add('dark');}d.style.colorScheme=t;}catch(e){}})();`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = await isSupabaseConfigured();
  let user: {
    id: string;
    username: string;
    accountId: string;
    balance: number;
    role: string;
    isAdmin: boolean;
  } | null = null;

  if (configured) {
    const supabase = await createSupabase();
    const { data: session } = await supabase.auth.getSession();
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
  }

  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${montserrat.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider>
          {configured ? (
            <>
              <Header user={user} />
              <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16 pt-6 sm:px-6">
                {children}
              </main>
              <Footer />
            </>
          ) : (
            <NotConfigured />
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
