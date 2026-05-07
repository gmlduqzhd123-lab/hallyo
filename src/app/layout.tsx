import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { GlobalFontProvider } from "@/components/global-font-provider";
import { PwaRegistry } from "@/components/pwa-registry";

export const metadata: Metadata = {
  title: "Hallyoswim | 여수한려초 수영부 관리",
  description: "여수한려초등학교 수영부 선수단 및 훈련 관리 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`min-h-screen bg-[#F8FAFC] text-slate-800 antialiased font-sans`}>
        <GlobalFontProvider />
        <PwaRegistry />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
