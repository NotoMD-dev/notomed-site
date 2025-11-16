"use client";

import ResumePage from "@/components/ResumePage";
import SiteHeader from "@/components/SiteHeader";

export default function ResumeRoutePage() {
  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <ResumePage />
    </div>
  );
}
