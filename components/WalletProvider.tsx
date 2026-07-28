"use client";

import React from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";

export default function Providers({ children }: { children: React.ReactNode }) {
  const plugins = [new PetraWallet()];

  return (
    <AptosWalletAdapterProvider plugins={plugins} autoConnect={true}>
      {children}
    </AptosWalletAdapterProvider>
  );
}
