"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false} // Tắt autoConnect để tránh lỗi khi vừa load trang
      dappConfig={{
        network: Network.CUSTOM,
        aptosApiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
        customEndpoints: {
          custom: "https://rpc.shelbynet.shelby.xyz/v1",
        },
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
