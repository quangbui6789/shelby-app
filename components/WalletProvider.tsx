"use client";

import React from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

const SHELBY_RPC = "https://api.shelbynet.shelby.xyz/v1";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      optInWallets={["Petra"]}
      dappConfig={{
        network: Network.CUSTOM,
        customNetwork: SHELBY_RPC,
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
