"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
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
          dappConfig={{
            network: Network.TESTNET,
            aptosApiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY || undefined,
          }}
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
