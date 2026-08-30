import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

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
  themeColor: "#6c4cf2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
