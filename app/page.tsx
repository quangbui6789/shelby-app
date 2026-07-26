"use client";

import dynamic from "next/dynamic";

const MainAppNoSSR = dynamic(() => import("@/components/MainApp"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-teal-400 font-mono text-sm">
      Loading Shelby Application...
    </div>
  ),
});

export default function Page() {
  return <MainAppNoSSR />;
}
