import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MainApp = dynamicImport(() => import("../components/MainApp"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-teal-400">
      Loading Shelby dApp...
    </div>
  ),
});

export default function Home() {
  return <MainApp />;
}
