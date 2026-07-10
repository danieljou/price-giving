import type { Metadata } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { I18nProvider } from "@/components/i18n-provider";

const firaSans = Fira_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "PRICE GIVING — Classification des prix",
  description: "Classification et attribution des prix PRICE GIVING",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${firaSans.variable} ${firaCode.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
