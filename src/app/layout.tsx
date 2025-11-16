// Applied Olive V3 background shell across all pages
import type { Metadata } from "next";
import { defaultMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-[#2a3830] text-[#f4f1ea]">
        <div className="relative min-h-screen bg-gradient-to-b from-[#344538] via-[#3e5142] to-[#485d4c]">
          <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.32]">
            <div className="h-full w-full bg-[linear-gradient(to_right,rgba(190,183,160,0.42)_1px,transparent_1px),linear-gradient(to_bottom,rgba(190,183,160,0.42)_1px,transparent_1px)] bg-[size:56px_56px]" />
          </div>
          <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.5] mix-blend-soft-light">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%),radial-gradient(circle_at_bottom,rgba(0,0,0,0.5),transparent_60%)]" />
          </div>
          <div className="relative z-10 min-h-screen">{children}</div>
        </div>
      </body>
    </html>
  );
}
