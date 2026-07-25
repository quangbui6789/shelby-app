"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <AptosWalletAdapterProvider
          autoConnect={true}
          onError={(error) => {
            console.error("Wallet Adapter Error:", error);
          }}
        >
          {children}
        </AptosWalletAdapterProvider>
      </body>
    </html>
  );
}
