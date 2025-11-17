import type { ReactNode } from "react";
import { createToolMetadata } from "@/lib/seo";

export const metadata = createToolMetadata({
  slug: "opioid-calc",
  title: "Opioid Regimen Calculator",
  description:
    "Comprehensive opioid conversion calculator that helps clinicians build safe inpatient regimens with PRN, multimodal, and tapering guidance.",
  keywords: [
    "opioid conversion calculator",
    "oral morphine equivalent",
    "inpatient pain management tool",
  ],
});

export default function OpioidToolLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
