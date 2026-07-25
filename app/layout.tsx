"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "@aptos-labs/wallet-adapter-petraj";
import "./globals.css";

const wallets = [new PetraWallet()];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <AptosWalletAdapterProvider 
          plugins={wallets} 
          autoConnect={true}
          dappInfo={{
            name: "Shelby Shelbynet",
            icon: "/favicon.ico",
          }}
        >
          {children}
        </AptosWalletAdapterProvider>
      </body>
    </html>
  );
}
