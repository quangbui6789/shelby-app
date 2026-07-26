"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { ReactNode } from "react";

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.TESTNET,
      }}
      onError={(error) => {
        // Bỏ qua lỗi mismatch network nếu user dùng custom RPC Shelbynet
        if (error?.toString().includes("Invalid network")) return;
        console.error("Wallet Adapter Error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
