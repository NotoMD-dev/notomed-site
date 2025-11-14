import PreOpQuickNotePage from "./client-page";
import { createToolMetadata } from "@/lib/seo";

export const metadata = createToolMetadata({
  slug: "preop-note",
  title: "Pre-Op QuickNote",
  description:
    "Guided preoperative assessment tool that compiles risk stratification, medication management, and documentation-ready notes for surgical patients.",
  keywords: [
    "preoperative assessment tool",
    "perioperative medicine checklist",
    "surgical clearance note",
  ],
});

export default function Page() {
  return <PreOpQuickNotePage />;
}
