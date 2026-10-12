import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PwaRegistry } from "@/components/pwa-registry";

export const metadata: Metadata = {
  title: "Hallyoswim | 여수한려초 수영부 관리",
  description: "여수한려초등학교 수영부 선수단 및 훈련 관리 플랫폼",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Hallyoswim",
    title: "Hallyoswim | 여수한려초 수영부 관리",
    description: "여수한려초등학교 수영부 선수단 및 훈련 관리 플랫폼",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Hallyoswim 수영부 관리",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning data-qr-url="https://hallyo.vercel.app/" data-qr-src="/qr.svg" data-qr-name="Hallyoswim 수영부 관리">
      <head>
        <link
          rel="preload"
          href="/fonts/MaplestoryB.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        {/* 📲 앱 설치 도우미: [data-ys-install] 버튼 → 바로 설치 또는 기기별 설치 방법 안내 */}
        <script src="/ys-install.js" defer />
        {/* 📱 QR로 접속: [data-qr] 버튼 → 큰 QR 창 */}
        <script src="/ys-qr.js" defer />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased">
        <PwaRegistry />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
