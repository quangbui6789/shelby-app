"use client";

import React from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.CUSTOM,
        aptosApiProvider: "https://api.shelbynet.shelby.xyz/v1",
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
