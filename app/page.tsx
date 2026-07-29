"use client";

import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";

const MainApp = dynamicImport(() => import("@/components/MainApp"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-teal-400 font-mono text-sm">
      Loading Shelby Ecosystem...
    </div>
  ),
});

export default function Home() {
  return <MainApp />;
}
