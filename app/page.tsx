"use client";

import dynamic from "next/dynamic";

// Tắt SSR cho MainApp để tránh crash trên trình duyệt
const MainApp = dynamic(() => import("@/components/MainApp"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-teal-400">
      Loading Shelby Ecosystem...
    </div>
  ),
});

export default function Home() {
  return <MainApp />;
}
