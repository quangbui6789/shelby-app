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
          }}
          onError={(error) => {
            console.error("Wallet connection error:", error);
          }}
        >
          {children}
        </AptosWalletAdapterProvider>
      </body>
    </html>
  );
}
