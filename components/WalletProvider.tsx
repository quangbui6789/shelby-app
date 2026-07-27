"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={{
        network: Network.CUSTOM,
        // Điền Endpoint RPC của Shelby Testnet
        customNetworkUrl: "https://rpc.shelbynet.shelby.xyz/v1", 
      }}
      onError={(error) => {
        // Bắt lỗi để không bị tràn màn hình đỏ ra UI
        console.warn("Wallet Adapter Network Warning:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
