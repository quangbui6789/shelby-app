"use client";

import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-teal-400">
      <h2 className="text-xl font-bold">404 - Not Found</h2>
      <Link href="/" className="mt-4 underline text-white">
        Return Home
      </Link>
    </div>
  );
}
