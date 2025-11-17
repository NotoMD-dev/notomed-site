// Applied Olive V3 background shell across all pages
import type { Metadata } from "next";
import { defaultMetadata } from "@/lib/seo";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next"; // 👈 add this

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ThemeProvider>
          <div className="relative min-h-screen theme-shell">
            <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.32]">
              <div className="h-full w-full theme-grid" />
            </div>
            <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.5] mix-blend-soft-light">
              <div className="h-full w-full theme-lacquer" />
            </div>
            <div className="relative z-10 min-h-screen">{children}</div>
          </div>
        </ThemeProvider>

        {/* 👇 Analytics should live inside <body>, after your app UI */}
        <Analytics />
      </body>
    </html>
  );
}
