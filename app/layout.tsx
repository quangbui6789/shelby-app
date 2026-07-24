import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shelby Protocol DApp",
  description: "Next-generation Web3 application built on Shelby",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
