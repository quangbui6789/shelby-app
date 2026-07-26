"use client";

import nextDynamic from "next/dynamic";

const MainApp = nextDynamic(() => import("../components/MainApp"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-teal-400">
      Loading Shelby dApp...
    </div>
  ),
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  return <MainApp />;
}
