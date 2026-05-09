import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { GlobalFontProvider } from "@/components/global-font-provider";
import { PwaRegistry } from "@/components/pwa-registry";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Hallyoswim | 여수한려초 수영부 관리",
  description: "여수한려초등학교 수영부 선수단 및 훈련 관리 플랫폼",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let font = 'MaplestoryL';
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'global_font').single();
    if (data?.value) {
      font = data.value;
    }
  } catch (e) {
    // Ignore error, fallback to default font
  }

  return (
    <html lang="ko" style={{ '--global-font': font } as React.CSSProperties}>
      <head>
        <link
          rel="preload"
          href={`/fonts/${font}.ttf`}
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased" style={{ fontFamily: `var(--global-font), sans-serif` }}>
        <GlobalFontProvider initialFont={font} />
        <PwaRegistry />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
