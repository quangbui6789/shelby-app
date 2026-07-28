"use client";

import React from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      optInWallets={["Petra"]}
      dappConfig={{
        network: Network.TESTNET, // Khai báo TESTNET để Adapter không chặn custom network
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
