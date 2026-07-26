"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
      <Link href="/" className="mt-4 text-teal-400 underline">
        Return Home
      </Link>
    </div>
  );
}
