"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.TESTNET, // Bắt buộc khai báo rõ Network.TESTNET ở đây
      }}
      onError={(error) => {
        console.error("Wallet Adapter Error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
