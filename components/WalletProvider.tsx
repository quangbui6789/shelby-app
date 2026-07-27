"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={
        {
          network: Network.CUSTOM,
          fullnode: "https://api.shelbynet.shelby.xyz/v1",
          nodeUrl: "https://api.shelbynet.shelby.xyz/v1",
          aptosApiKeys: {
            custom: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
          },
        } as any
      }
      onError={(error) => {
        console.log("Wallet connection status:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
