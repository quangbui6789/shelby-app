"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={
        {
          network: "custom" as any,
          fullnode: "https://api.shelbynet.shelby.xyz/v1",
          nodeUrl: "https://api.shelbynet.shelby.xyz/v1",
        } as any
      }
      onError={(error) => {
        console.warn("Wallet status:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
