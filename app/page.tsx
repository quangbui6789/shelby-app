"use client";

import dynamicImport from "next/dynamic";

const MainApp = dynamicImport(() => import("../components/MainApp"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-teal-400 font-medium">
      Loading Shelby Protocol dApp...
    </div>
  ),
});

export default function Home() {
  return <MainApp />;
}
