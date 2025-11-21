// Applied Olive V3 background shell across all pages
import type { Metadata } from "next";
import Script from "next/script";
import { defaultMetadata } from "@/lib/seo";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { cn } from "@/lib/cn";
import { THEME_OVERLAYS, THEME_SHELL_CLASS } from "@/lib/design-system";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-4MT1RZ22NS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-4MT1RZ22NS');
          `}
        </Script>
        <ThemeProvider>
          <div className={cn("relative min-h-screen", THEME_SHELL_CLASS)}>
            <div className={THEME_OVERLAYS.grid}>
              <div className={THEME_OVERLAYS.gridInner} />
            </div>
            <div className={THEME_OVERLAYS.lacquer}>
              <div className={THEME_OVERLAYS.lacquerInner} />
            </div>
            <div className="relative z-10 min-h-screen">{children}</div>
          </div>
        </ThemeProvider>

        {/* 👇 Analytics should live inside <body>, after your app UI */}
        <Analytics />
        <SpeedInsights/>
      </body>
    </html>
  );
}
