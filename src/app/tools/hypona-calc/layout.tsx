import type { ReactNode } from "react";
import { createToolMetadata } from "@/lib/seo";

export const metadata = createToolMetadata({
  slug: "hypona-calc",
  title: "Hyponatremia Calculator",
  description:
    "Interactive hyponatremia calculator that walks clinicians through volume status, etiologies, and treatment considerations for low sodium patients.",
  keywords: [
    "hyponatremia workup",
    "sodium correction calculator",
    "hospital medicine hyponatremia",
  ],
});

export default function HyponatremiaToolLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
