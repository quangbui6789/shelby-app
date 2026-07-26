"use client";

import dynamic from "next/dynamic";

// Dùng relative path để chắc chắn Next.js tìm đúng file
const MainApp = dynamic(() => import("../components/MainApp"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-teal-400">
      Loading Shelby dApp...
    </div>
  ),
});

// Ép trang này thành Fully Dynamic Rendering (không Prerender tĩnh trên Server)
export const dynamicParams = true;
export const revalidate = 0;

export default function Home() {
  return <MainApp />;
}
