// src/app/support/success/page.tsx
import Link from "next/link";

export default function SupportSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 p-6 max-w-md w-full text-center">
        <h1 className="text-xl font-semibold mb-2">See you soon! 💛</h1>
        <p className="text-sm text-gray-600 mb-4">
          Canceled! 
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-100"
        >
          ← Back to NotoMed.dev
        </Link>
      </div>
    </div>
  );
}
