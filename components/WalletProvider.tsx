"use client";

import { ReactNode } from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

export default function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.CUSTOM,
        aptosApiKeys: {
          custom: process.env.NEXT_PUBLIC_SHELBY_API_KEY || "",
        },
        customEndpoints: {
          custom: "https://api.shelbynet.shelby.xyz/v1",
        },
      }}
      onError={(error) => {
        console.error("Wallet Adapter Error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
