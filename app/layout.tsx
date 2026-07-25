"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "@aptos-labs/wallet-adapter-petraj";   // ← Thêm dòng này
import "./globals.css";

const wallets = [new PetraWallet()];   // ← Thêm mảng wallets

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <AptosWalletAdapterProvider 
          plugins={wallets}           // ← Quan trọng
          autoConnect={true}
          dappInfo={{
            name: "Shelby Shelbynet",
            icon: "https://shelby.xyz/favicon.ico", // có thể thay bằng link logo của bạn
          }}
        >
          {children}
        </AptosWalletAdapterProvider>
      </body>
    </html>
  );
}


