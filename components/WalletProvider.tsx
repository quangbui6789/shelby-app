"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { ReactNode } from "react";

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.CUSTOM, // Để CUSTOM thay vì TESTNET
      }}
      onError={(error) => {
        if (error?.toString().includes("Invalid network")) return;
        console.error("Wallet Adapter Error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
