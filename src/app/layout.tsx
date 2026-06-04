import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { NotificationChecker } from "@/components/shared/NotificationChecker";
import { CurrencyInit } from "@/components/shared/CurrencyInit";
import { db } from "@/db";
import { crmSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { setActiveCurrency } from "@/lib/constants";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

function getSetting(key: string): string {
  try {
    const row = db
      .select()
      .from(crmSettings)
      .where(eq(crmSettings.key, key))
      .get();
    return row?.value || "";
  } catch {
    return "";
  }
}

export const metadata: Metadata = {
  title: "Auto-CRM - Tu CRM con Inteligencia Artificial",
  description:
    "CRM conversacional con pipeline de ventas, clasificacion automatica de leads y seguimiento inteligente. Construido con Claude Code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currency = getSetting("currency") || "MXN";
  setActiveCurrency(currency);
  const crmName = getSetting("crm_name") || "Auto-CRM";
  const crmLogo = getSetting("crm_logo");
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex" suppressHydrationWarning>
        <CurrencyInit currency={currency} />
        <TooltipProvider>
          <Sidebar name={crmName} logo={crmLogo} />
          <div className="flex-1 flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 p-4 md:p-6 bg-background overflow-auto">
              {children}
            </main>
          </div>
          <Toaster />
          <NotificationChecker />
        </TooltipProvider>
      </body>
    </html>
  );
}
