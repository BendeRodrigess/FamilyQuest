import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FamilyQuest",
  description: "Сімейні квести: завдання, XP і винагороди для дітей та батьків.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FamilyQuest",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6c4cf2" },
    { media: "(prefers-color-scheme: dark)", color: "#131220" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: атрибут data-theme проставляє скрипт нижче,
    // ще до гідратації, тому серверна й клієнтська розмітка тут відрізняються.
    <html
      lang="uk"
      className={`${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          {children}
          <ServiceWorkerRegistrar />
        </ThemeProvider>
      </body>
    </html>
  );
}
