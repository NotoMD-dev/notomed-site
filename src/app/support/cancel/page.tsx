// Restyled support cancel view to Olive V3 gradient card
import SiteHeader from "@/components/SiteHeader";
import { BackButton } from "@/components/BackButton";

export default function SupportCancelPage() {
  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pb-16 pt-20">
        <div className="w-full rounded-2xl border border-[#7a897b] bg-gradient-to-br from-[#3f5143] via-[#475b4c] to-[#506656] p-8 text-center shadow-[0_22px_70px_rgba(0,0,0,0.7)]">
          <BackButton href="/" className="flex justify-center" />
          <h1 className="text-2xl font-semibold text-[#f9f6ef] mb-2">See you soon! 💛</h1>
          <p className="text-sm text-[#d0c8b9] mb-6">Canceled!</p>
        </div>
      </div>
    </div>
  );
}
