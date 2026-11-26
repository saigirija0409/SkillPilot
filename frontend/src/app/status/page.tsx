import Link from "next/link";

import { BackendConnectivityCard } from "@/components/status/BackendConnectivityCard";
import { BrandLogo, EditorialHeading } from "@/components/ui";

export default function SystemStatusPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-14">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href="/">
          <BrandLogo size="sm" subtitle="Diagnostics" />
        </Link>
        <Link
          href="/"
          className="text-sm font-semibold text-forest hover:underline underline-offset-4"
        >
          ← Back to Home
        </Link>
      </div>

      <EditorialHeading
        eyebrow="Developer Diagnostics"
        title="System &amp; service"
        italicAccent="readiness."
        subtitle="Internal health check verifying FastAPI connectivity, Supabase configuration, and Gemini integration."
        className="mb-8"
      />

      <BackendConnectivityCard />
    </main>
  );
}
